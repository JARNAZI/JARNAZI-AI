import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface DebateSummaryEmailProps {
    topic: string;
    actionUrl: string;
}

export default function DebateSummaryEmail({ topic, actionUrl }: DebateSummaryEmailProps) {
    return (
        <EmailLayout preview={`Consensus Reached: ${topic}`}>
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Consensus Reached
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                The session regarding <strong>"{topic}"</strong> has successfully concluded. The council has deliberated and reached a verdict.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    View Full Transcript
                </Button>
            </Section>
        </EmailLayout>
    );
}
