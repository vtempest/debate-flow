import { google } from 'googleapis';

const calendar = google.calendar('v3');

///ned oauth
export async function createMeetWithInvites(oauth2Client: any, summary: string, description: string, startDateTime: string, endDateTime: string, attendeesEmails: string[]) {
    const res = await calendar.events.insert({
        calendarId: 'primary',
        auth: oauth2Client,
        requestBody: {
            summary,
            description,
            start: {
                dateTime: startDateTime,
                timeZone: 'America/Los_Angeles',
            },
            end: {
                dateTime: endDateTime,
                timeZone: 'America/Los_Angeles',
            },
            attendees: attendeesEmails.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: crypto.randomUUID(),
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        },
        conferenceDataVersion: 1,
        sendUpdates: 'all',
    });

    return res.data;
}