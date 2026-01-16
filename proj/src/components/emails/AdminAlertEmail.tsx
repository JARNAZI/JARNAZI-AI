import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface AdminAlertEmailProps {
    subject: string;
    message: string;
    actionUrl: string;
}

export default function AdminAlertEmail({ subject, message, actionUrl }: AdminAlertEmailProps) {
    return (
        <EmailLayout preview={`[ALERT] ${subject}`}>
            <Heading className="text-[20px] font-bold text-red-600 text-center p-0 my-[30px] mx-0">
                System Alert
            </Heading>

            <Section className="bg-red-50 border border-red-200 rounded-lg p-4 my-6">
                <Text className="m-0 text-red-900 font-bold mb-2">{subject}</Text>
                <Text className="m-0 text-red-800">{message}</Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-red-600 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    Go to Admin Panel
                </Button>
            </Section>
        </EmailLayout>
    );
}
