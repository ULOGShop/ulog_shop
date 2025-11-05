import DOMPurify from "dompurify";

/**
 * @param html - Raw HTML string
 * @returns Sanitized HTML string safe for rendering
 */

export const sanitizeHTML = (html: string): string => {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "b", "i", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "a", "span", "div", "blockquote", "code", "pre"],
        ALLOWED_ATTR: ["href", "target", "rel", "class"],
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        SAFE_FOR_TEMPLATES: true,
    });
};

/**
 * @param html - Raw HTML string
 * @returns Plain text without any HTML
 */

export const stripHTML = (html: string): string => {
    const clean = DOMPurify.sanitize(html, {ALLOWED_TAGS: []});
    return clean;
};