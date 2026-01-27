import * as React from 'react';
import { Section, Text, Heading, Hr } from '@react-email/components';
import EmailLayout from './EmailLayout';

interface ContactReplyEmailProps {
    name: string;
    replyMessage: string;
    originalMessage: string;
}

export default function ContactReplyEmail({ name, replyMessage, originalMessage }: ContactReplyEmailProps) {
    return (
        <EmailLayout preview="Response from Jarnazi Support">
            <Heading className="text-[20px] font-bold text-textColor text-center p-0 my-[30px] mx-0">
                Response from Support
            </Heading>
            <Text className="text-[14px] leading-[24px] text-textColor">
                Dear {name},
            </Text>
            <Text className="text-[14px] leading-[24px] text-textColor whitespace-pre-wrap">
                {replyMessage}
            </Text>

            <Hr className="border border-solid border-borderColor my-[26px] mx-0 w-full" />

            <Section className="pl-4 border-l-2 border-gray-200">
                <Text className="text-[12px] font-bold text-mutedColor m-0 mb-2">Original Message:</Text>
                <Text className="text-[12px] italic text-mutedColor m-0 whitespace-pre-wrap">
                    {originalMessage}
                </Text>
            </Section>
        </EmailLayout>
    );
}
