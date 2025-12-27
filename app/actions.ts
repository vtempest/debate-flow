"use server";

import { parseHTML } from "linkedom";

export async function getTournamentNames() {
    try {
        const res = await fetch("https://www.tabroom.com/index/index.mhtml", {
            // next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch tabroom: ${res.status}`);
        }

        const html = await res.text();
        const { document } = parseHTML(html);

        const names = Array.from(
            document.querySelectorAll('#tournlist tbody tr td:nth-child(2)')
        ).map((td: any) => td.textContent.replace(/\r/g, "").trim().slice(0, 50).split("		")?.[0]).filter((n: string) => n.length > 0);

        // Remove duplicates
        const uniqueNames = Array.from(new Set(names));
        console.log(`Found ${uniqueNames.length} tournaments`);
        return uniqueNames;
    } catch (error) {
        console.error("Error fetching tournament names:", error);
        return [];
    }
}

export async function shareSpeech(emails: string[], speechName: string, content: string) {
    // In a real app, this would use an email service like Resend, SendGrid, etc.
    console.log(`[Mock Email Service] Sharing speech "${speechName}" with:`, emails);
    console.log(`[Mock Email Service] Content preview: ${content.substring(0, 50)}...`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, message: `Shared with ${emails.length} participants` };
}
