import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { google } from 'googleapis';
import { CalendarService } from './calendar';
import { Agent } from './agent';

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5175',
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key', // In production, use a secure env var
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using https
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport Config
passport.serializeUser((user: any, done) => {
    done(null, user);
});

passport.deserializeUser((user: any, done) => {
    done(null, user);
});

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
    process.exit(1);
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar']
}, (accessToken, refreshToken, profile, done) => {
    // Store tokens in user session or DB
    const user = {
        profile,
        accessToken,
        refreshToken
    };
    return done(null, user);
}));

// Routes
app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/calendar'],
    accessType: 'offline',
    prompt: 'consent'
}));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect to frontend app
        res.redirect('http://localhost:5175'); // Assuming Vite runs on 5175
    }
);

app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({ user: req.user });
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/api/query', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    const { query } = req.body;
    const user = req.user as any;

    try {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            'http://localhost:3000/auth/google/callback'
        );
        oAuth2Client.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
        });

        const calendarService = new CalendarService(oAuth2Client);
        const agent = new Agent();

        console.time('Gemini Parse Intent');
        const intentData = await agent.parseIntent(query);
        console.timeEnd('Gemini Parse Intent');
        console.log('Parsed Internal Data:', JSON.stringify(intentData, null, 2));

        let responseText = '';

        if (intentData.intent === 'LIST_EVENTS') {
            console.time('Calendar List Events');
            const events = await calendarService.listEvents(intentData.startTime, intentData.endTime);
            console.timeEnd('Calendar List Events');
            responseText = `Here are your upcoming events:\n${events}`;
        } else if (intentData.intent === 'CREATE_EVENT') {
            // Check if we are confirming a previous conflict
            if (intentData.ignoreConflicts && (req.session as any).pendingEvent) {
                console.time('Calendar Create Event (Forced - From Session)');
                const pendingEvent = (req.session as any).pendingEvent;
                const result = await calendarService.createEvent(pendingEvent);
                console.timeEnd('Calendar Create Event (Forced - From Session)');
                responseText = `I've forced that schedule for you. ${result}`;
                (req.session as any).pendingEvent = null; // Clear after use
            }
            // Handle explicit ignoreConflicts in a single turn (rare but possible)
            else if (intentData.ignoreConflicts) {
                console.time('Calendar Create Event (Forced - Immediate)');
                const result = await calendarService.createEvent(intentData);
                console.timeEnd('Calendar Create Event (Forced - Immediate)');
                responseText = `I've forced that schedule for you. ${result}`;
            }
            // Standard flow
            else {
                console.time('Calendar Check Availability');
                const availability = await calendarService.checkAvailability(intentData.startTime, intentData.endTime);
                console.timeEnd('Calendar Check Availability');

                if (availability.available) {
                    console.time('Calendar Create Event');
                    const result = await calendarService.createEvent(intentData);
                    console.timeEnd('Calendar Create Event');
                    responseText = `I've scheduled that for you. ${result}`;
                    (req.session as any).pendingEvent = null;
                } else {
                    // Conflict found: Store intentData in session
                    (req.session as any).pendingEvent = intentData;
                    const conflicts = availability.conflicts.map((e: any) => e.summary).join(', ');
                    responseText = `I found a conflict with: ${conflicts}. Do you want to schedule anyway? (Reply "schedule anyway" to override)`;
                }
            }
        } else if (intentData.intent === 'CANCEL_EVENT') {
            console.time('Calendar Get Events for Cancellation');
            const events = await calendarService.getEvents(intentData.startTime, intentData.endTime);
            console.timeEnd('Calendar Get Events for Cancellation');

            let eventsToDelete = events;
            if (intentData.summary) {
                const summaryLower = intentData.summary.toLowerCase();
                eventsToDelete = events.filter((e: any) =>
                    (e.summary && e.summary.toLowerCase().includes(summaryLower)) ||
                    (summaryLower.includes(e.summary && e.summary.toLowerCase()))
                );
            }

            if (eventsToDelete.length === 0) {
                responseText = "I couldn't find any matching events to cancel.";
            } else if (eventsToDelete.length === 1) {
                const event = eventsToDelete[0];
                await calendarService.deleteEvent(event.id);
                const date = new Date(event.start.dateTime || event.start.date).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
                responseText = `I've canceled the event: "${event.summary}" at ${date}`;
            } else {
                // Store candidates for selection
                (req.session as any).cancellationCandidates = eventsToDelete;
                responseText = `I found multiple matching events. Please specify which one to cancel (e.g., "1" or "the first one"):\n` +
                    eventsToDelete.map((e: any, index: number) => {
                        const date = new Date(e.start.dateTime || e.start.date).toLocaleString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric',
                            hour: 'numeric', minute: '2-digit', hour12: true
                        });
                        const attendees = e.attendees ? ' With ' + e.attendees.map((a: any) => a.displayName || a.email).join(', ') : '';
                        return `${index + 1}. ${date} - ${e.summary}${attendees}`;
                    }).join('\n');
            }
        } else if (intentData.intent === 'SELECT_OPTION' && (req.session as any).cancellationCandidates) {
            console.time('Calendar Select Option for Cancellation');
            const candidates = (req.session as any).cancellationCandidates;
            const selection = intentData.summary.toLowerCase();
            let selectedEvent = null;

            // Try numeric selection first
            const index = parseInt(selection) - 1;
            if (!isNaN(index) && index >= 0 && index < candidates.length) {
                selectedEvent = candidates[index];
            } else {
                // Try fuzzy matching
                if (selection.includes("first") || selection.includes("1st")) selectedEvent = candidates[0];
                else if (selection.includes("second") || selection.includes("2nd")) selectedEvent = candidates[1];
                else if (selection.includes("third") || selection.includes("3rd")) selectedEvent = candidates[2];
                // Basic summary matching
                else {
                    selectedEvent = candidates.find((e: any) => e.summary.toLowerCase().includes(selection));
                }
            }

            if (selectedEvent) {
                await calendarService.deleteEvent(selectedEvent.id);
                const date = new Date(selectedEvent.start.dateTime || selectedEvent.start.date).toLocaleString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit', hour12: true
                });
                responseText = `I've canceled the event: "${selectedEvent.summary}" at ${date}`;
                (req.session as any).cancellationCandidates = null;
            } else {
                responseText = "I couldn't identify which event you meant. Please say the number (e.g., '1').";
            }
            console.timeEnd('Calendar Select Option for Cancellation');
        } else if (intentData.ignoreConflicts && (req.session as any).pendingEvent) {
            // Catch-all: If intent was UNKNOWN because user just said "schedule anyway", but we have a pending event
            console.time('Calendar Create Event (Forced - Catchall)');
            const pendingEvent = (req.session as any).pendingEvent;
            const result = await calendarService.createEvent(pendingEvent);
            console.timeEnd('Calendar Create Event (Forced - Catchall)');
            responseText = `I've forced that schedule for you. ${result}`;
            (req.session as any).pendingEvent = null;
        } else {
            responseText = "I didn't quite catch that. Could you rephrase?";
        }

        res.json({ response: responseText, data: intentData });

    } catch (error) {
        console.error('Error processing query:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    // Keep the process alive
    setInterval(() => {
        // Heartbeat
    }, 10000);
});

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, '../frontend-new/dist');
app.use(express.static(frontendPath));

// Anything that doesn't match the above, send back index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

server.on('error', (e) => {
    console.error('Server failed to start:', e);
});
