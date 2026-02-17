import { google } from 'googleapis';
import { authorize } from './auth';

export class CalendarService {
    private calendar: any;

    constructor(oAuth2Client: any) {
        this.calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    }

    private getCalendar() {
        return this.calendar;
    }

    async listEvents(timeMin?: string, timeMax?: string, maxResults: number = 10) {
        const calendar = await this.getCalendar();
        try {
            const params: any = {
                calendarId: 'primary',
                timeMin: timeMin || new Date().toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            };

            if (timeMax) {
                params.timeMax = timeMax;
            }

            const res = await calendar.events.list(params);
            const events = res.data.items;
            if (!events || events.length === 0) {
                return 'No upcoming events found.';
            }
            return events.map((event: any) => {
                const start = event.start.dateTime || event.start.date;
                return `${start} - ${event.summary}`;
            }).join('\n');
        } catch (error) {
            console.error('The API returned an error: ' + error);
            throw error;
        }
    }

    async checkAvailability(startTime: string, endTime: string): Promise<{ available: boolean; conflicts: any[] }> {
        const calendar = await this.getCalendar();
        try {
            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: startTime,
                timeMax: endTime,
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
            });
            const events = res.data.items || [];
            return {
                available: events.length === 0,
                conflicts: events
            };
        } catch (error) {
            console.error('Error checking availability:', error);
            throw error;
        }
    }

    async createEvent(eventDetails: any) {
        const calendar = await this.getCalendar();
        try {
            const event = {
                summary: eventDetails.summary,
                location: eventDetails.location,
                description: eventDetails.description,
                start: {
                    dateTime: eventDetails.startTime, // ISO format
                    timeZone: process.env.TIMEZONE || 'UTC', // Default, should be dynamic
                },
                end: {
                    dateTime: eventDetails.endTime, // ISO format
                    timeZone: process.env.TIMEZONE || 'UTC',
                },
                attendees: eventDetails.attendees || [],
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 24 * 60 },
                        { method: 'popup', minutes: 10 },
                    ],
                },
            };

            const res = await calendar.events.insert({
                calendarId: 'primary',
                resource: event,
            });
            return `Event created: ${res.data.htmlLink}`;
        } catch (error) {
            console.error('Error creating event:', error);
            throw error;
        }
    }
    async getEvents(timeMin: string, timeMax: string) {
        const calendar = await this.getCalendar();
        try {
            const res = await calendar.events.list({
                calendarId: 'primary',
                timeMin: timeMin,
                timeMax: timeMax,
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime',
            });
            return res.data.items || [];
        } catch (error) {
            console.error('Error fetching events:', error);
            throw error;
        }
    }

    async deleteEvent(eventId: string) {
        const calendar = await this.getCalendar();
        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
            return 'Event deleted successfully.';
        } catch (error) {
            console.error('Error deleting event:', error);
            throw error;
        }
    }
}
