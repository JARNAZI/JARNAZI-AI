import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface WelcomeEmailProps {
    name: string;
    actionUrl: string;
}

export default function WelcomeEmail({ name, actionUrl }: WelcomeEmailProps) {
    return (
        <EmailLayout preview="Welcome to Jarnazi DebateAI">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Welcome, {name}!
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                We are honored to have you join our council. You have taken the first step towards orchestrating high-level debates between advanced AI models.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    Start Your First Session
                </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                Ready to uncover the truth?
            </Text>
        </EmailLayout>
    );
}
