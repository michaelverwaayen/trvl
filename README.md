# RFQ Mobile App

This project aims to build a mobile application that allows users to request quotes from multiple vendors for maintenance or repair tasks. Users can describe their issue, attach a photo, answer follow-up questions, and receive competitive quotes.

## Features & UI Ideas

- **Issue Submission**: Users can describe their problem (e.g., broken water heater) and upload one or more photos.
- **Questionnaire**: Dynamic questions help capture relevant details (e.g., model, urgency, desired service time).
- **Quote Requests**: The system sends the RFQ to registered vendors who can submit their quotes in-app.
- **Vendor Profiles**: Vendors can showcase ratings, past jobs, and contact information.
- **Notifications**: Users receive push notifications when vendors respond.
- **Chat**: Optional real-time chat between user and vendor for clarifications.
- **Job Tracking**: Keep track of job status (requested, quoted, scheduled, completed).
- **Vendor Categories**: Organize service providers by category (plumbers, electricians, etc.) for easier search.
- **Quote Deadlines**: Allow users to set expiration dates for incoming quotes.
- **In-App Payments**: Enable secure payment processing once a quote is accepted.

## Potential UI Improvements

1. **Streamlined Onboarding**: Simple sign-up or sign-in with social login options.
2. **Guided Issue Flow**: Step-by-step screens for problem description, photos, and questions.
3. **Quote Comparison**: Table or card layout to easily compare vendor quotes.
4. **Vendor Ratings**: Display average ratings and review snippets directly in the quote list.
5. **Dark Mode**: Provide light and dark themes for better accessibility.
6. **Localization**: Plan for multiple languages to broaden user base.
7. **Progress Indicators**: Visual cues to show quote and job progress.
8. **Favorite Vendors**: Users can bookmark preferred service providers.
9. **Map View**: Display vendor locations and distance from the user.

---
This repository now includes an initial React Native scaffold located in the `mobile` directory. Future work will flesh out screens and integrate backend services to manage RFQs, quotes, and vendor management.
