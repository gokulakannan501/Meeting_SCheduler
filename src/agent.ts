import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

import { ContactService } from './contacts';

export class Agent {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private contactService: ContactService;

    constructor(contactService?: ContactService) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in .env');
        }
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        this.contactService = contactService || new ContactService();
    }
    async parseIntent(userInput: string) {
        const timeZone = process.env.TIMEZONE || 'UTC';
        const now = new Date().toLocaleString('en-US', { timeZone, timeZoneName: 'longOffset' });
        const contactsList = Object.entries(this.contactService.getAllContacts())
            .map(([name, email]) => `${name}: ${email}`)
            .join(', ');

        const prompt = `
        Current Time: ${now}
        Saved Contacts: ${contactsList}
        
        You are a smart calendar assistant. Analyze the user's input and extract the intent and details into a strict JSON format.
        
        Possible Intents: "LIST_EVENTS", "CREATE_EVENT", "CANCEL_EVENT", "UNKNOWN"
        
        Rules:
        1. If intent is "CREATE_EVENT", calculate start and end times (default duration 30 mins) based on "Current Time".
        2. Format times in ISO 8601 (YYYY-MM-DDTHH:mm:ss.sss+HH:mm) WITH the timezone offset shown in "Current Time".
        3. Extract attendees carefully. Always capture any email address mentioned in the input (e.g., "with user@example.com"). If a name matches a "Saved Contact", use that email. Return as an array of objects: [{"email": "..."}].
        4. If intent is "LIST_EVENTS" or "CANCEL_EVENT" and user specifies a time range (e.g. "today", "tomorrow"), set startTime and endTime covering that range. If no time specified, default to next 24 hours.
        5. If user says "schedule anyway", "ignore conflict", or "force", set "ignoreConflicts": true.
        6. If the user is selecting an item from a list (e.g. "first one", "option 2", "the 10am one"), set intent to "SELECT_OPTION" and put the selection detail in "summary".

        User Input: "${userInput}"
        
        Output JSON Schema:
        {
            "intent": "LIST_EVENTS" | "CREATE_EVENT" | "CANCEL_EVENT" | "SELECT_OPTION" | "UNKNOWN",
            "summary": "Meeting Title",
            "startTime": "ISO String",
            "endTime": "ISO String",
            "attendees": [{"email": "example@test.com"}],
            "location": "Location or Link",
            "ignoreConflicts": boolean
        }
        
        Respond ONLY with the JSON string.
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response.text();
            // Clean up potentially markdown formatted JSON
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Error parsing intent:', error);
            return { intent: 'UNKNOWN' };
        }
    }
}
