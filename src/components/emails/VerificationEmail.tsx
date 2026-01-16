import * as React from 'react';
import { Section, Text, Button, Heading } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface VerificationEmailProps {
    actionUrl: string;
}

export default function VerificationEmail({ actionUrl }: VerificationEmailProps) {
    return (
        <EmailLayout preview="Verify your email address">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Verify your email
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor text-center">
                To access the full power of Jarnazi DebateAI and ensure the security of your account, please verify your email address.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-accentColor rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                    href={actionUrl}
                >
                    Verify Email Address
                </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-mutedColor text-center">
                This link will expire in 24 hours.
            </Text>
        </EmailLayout>
    );
}
