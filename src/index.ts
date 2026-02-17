import { CalendarService } from './calendar';
import { Agent } from './agent';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') }); // Explicit path if needed

async function main() {
    console.log('Initializing Meeting Scheduler Agent...');

    // Check for API Keys
    if (!process.env.GEMINI_API_KEY) {
        console.error('Please set GEMINI_API_KEY in .env');
        process.exit(1);
    }

    const calendarService = new CalendarService(null);
    const agent = new Agent();

    console.log('Agent Ready! Types commands like "Schedule a meeting with text@example.com tomorrow at 10am" or "What do I have today?"');
    console.log('Type "exit" to quit.');

    while (true) {
        const { input } = await inquirer.prompt([
            {
                type: 'input',
                name: 'input',
                message: 'You:',
            },
        ]);

        if (input.toLowerCase() === 'exit') {
            break;
        }

        try {
            console.log('Analyzing...');
            const intentData = await agent.parseIntent(input);
            console.log('Intent:', intentData.intent);

            if (intentData.intent === 'LIST_EVENTS') {
                const events = await calendarService.listEvents(intentData.startTime, intentData.endTime);
                console.log('\n📅 Upcoming Events:');
                console.log(events);
                console.log('');
            } else if (intentData.intent === 'CREATE_EVENT') {
                console.log(`Scheduling "${intentData.summary}" at ${intentData.startTime}...`);
                const result = await calendarService.createEvent(intentData);
                console.log('✅ ' + result);
            } else {
                console.log("I didn't quite catch that. Could you rephrase?");
            }
        } catch (error) {
            console.error('Error processing request:', error);
        }
    }
}

// Legacy CLI entry point - Commented out as it does not support the new Web OAuth flow
// main();
