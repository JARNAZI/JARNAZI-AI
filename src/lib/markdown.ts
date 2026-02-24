import DOMPurify from 'isomorphic-dompurify';

export function renderMarkdown(markdown: string | null | undefined): string {
    if (!markdown || !markdown.trim()) {
        return 'Content not available.';
    }

    let html = markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
        .replace(/\n\n/gim, '</p><p>')
        .replace(/\n/gim, '<br />');

    if (!html.startsWith('<h') && !html.startsWith('<p')) {
        html = `<p>${html}</p>`;
    }

    return DOMPurify.sanitize(html);
}
