"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { ArrowRight, Loader2 } from "lucide-react"

interface StartDebateButtonProps {
    lang: string
    text: string
}

export function StartDebateButton({ lang, text }: StartDebateButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleClick = async () => {
        try {
            setIsLoading(true)
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                toast.error("Please log in to start a debate")
                setIsLoading(false)
                return
            }

            router.push(`/${lang}/debate`)
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong")
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-primary px-10 font-bold text-white transition-all duration-300 hover:bg-indigo-600 hover:shadow-[0_0_40px_-5px_var(--primary)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
            {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
                <>
                    <span className="mr-2">{text}</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </>
            )}
        </button>
    )
}
