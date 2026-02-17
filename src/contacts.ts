import * as fs from 'fs';
import * as path from 'path';

const CONTACTS_PATH = path.join(__dirname, '../contacts.json');

export class ContactService {
    private contacts: Record<string, string> = {};

    constructor() {
        this.loadContacts();
    }

    private loadContacts() {
        if (fs.existsSync(CONTACTS_PATH)) {
            this.contacts = JSON.parse(fs.readFileSync(CONTACTS_PATH, 'utf-8'));
        } else {
            // Default mock contacts
            this.contacts = {
                'alice': 'alice@example.com',
                'bob': 'bob@example.com',
                'team': 'team@example.com'
            };
            this.saveContacts();
        }
    }

    private saveContacts() {
        fs.writeFileSync(CONTACTS_PATH, JSON.stringify(this.contacts, null, 2));
    }

    getEmail(name: string): string | undefined {
        return this.contacts[name.toLowerCase()];
    }

    addContact(name: string, email: string) {
        this.contacts[name.toLowerCase()] = email;
        this.saveContacts();
    }

    getAllContacts() {
        return this.contacts;
    }
}
