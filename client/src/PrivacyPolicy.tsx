

const PrivacyPolicy = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
            <h1>Privacy Policy</h1>
            <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
                Meeting Scheduler Agent ("we", "our", or "us") is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, and safeguard your information when you use our application
                to schedule and manage your Google Calendar events.
            </p>

            <h2>2. Information We Collect</h2>
            <p>
                We only collect information necessary to provide our services:
            </p>
            <ul>
                <li><strong>Google User Data:</strong> When you sign in with Google, we receive your email address and profile information to authenticate you.</li>
                <li><strong>Calendar Data:</strong> We access your Google Calendar to list upcoming events, check for conflicts, and create new meetings as requested by you.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
                We use your information solely for the following purposes:
            </p>
            <ul>
                <li>To authenticate your identity.</li>
                <li>To understand your natural language scheduling requests.</li>
                <li>To retrieve your calendar availability.</li>
                <li>To schedule events on your behalf.</li>
            </ul>

            <h2>4. Google API Services User Data Policy</h2>
            <p>
                Meeting Scheduler Agent's use and transfer to any other app of information received from Google APIs will adhere to
                <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer"> Google API Services User Data Policy</a>,
                including the Limited Use requirements.
            </p>

            <h2>5. Data Sharing</h2>
            <p>
                We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
                We do not share your calendar data with third-party AI models for training purposes.
                Data processed by our AI (Gemini) is used strictly for intent classification and entity extraction within the context of your request.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have any questions about this Privacy Policy, please contact us.
            </p>

            <div style={{ marginTop: '40px', borderTop: '1px solid #ccc', paddingTop: '20px' }}>
                <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>&larr; Back to App</a>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
