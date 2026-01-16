import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface AdminGrantEmailProps {
    tokens: number;
    reason: string;
    actionUrl: string;
}

export default function AdminGrantEmail({ tokens, reason, actionUrl }: AdminGrantEmailProps) {
    return (
        <EmailLayout preview="You received new tokens">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Token Grant Received
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                An administrator has granted <strong>{tokens} tokens</strong> to your account.
            </Text>
            <Section className="bg-gray-50 rounded p-4 text-center border border-gray-100 my-4">
                <Text className="text-sm text-gray-500 m-0 mb-1 uppercase text-xs font-bold tracking-wider">Reason</Text>
                <Text className="text-base text-gray-800 m-0 italic">"{reason}"</Text>
            </Section>
            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    Go to Dashboard
                </Button>
            </Section>
        </EmailLayout>
    );
}
