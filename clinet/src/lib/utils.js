export function formatMessageTIme(date) {
    if (!date) return ""
    return new Date(date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })
}

export function formatLastSeen(date) {
    if (!date) return ""
    const lastSeen = new Date(date)
    const now = new Date()
    const diff = (now - lastSeen) / 1000 
    
    if (diff < 60) return "just now"
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    
    return lastSeen.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function formatDateSeparator(date) {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) return "Today";
    if (messageDate.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return messageDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}