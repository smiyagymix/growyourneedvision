import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

export interface Message {
    id: string;
    sender: string;
    content: string;
    time: string;
    avatar: string;
    read: boolean;
}

export const useMessages = (role: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            try {
                // Try to fetch from 'messages' collection
                try {
                    const records = await pb.collection('messages').getList(1, 20, {
                        // sort: '-created', // Removed to prevent 400 error
                        filter: `recipient_role = "${role}" || recipient_role = "All"`,
                        expand: 'sender'
                    });
                    
                    const realMessages = records.items.map((item: any) => ({
                        id: item.id,
                        sender: item.expand?.sender?.name || item.sender_name || 'Unknown',
                        content: item.content,
                        time: new Date(item.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        avatar: item.expand?.sender?.avatar 
                            ? pb.files.getUrl(item.expand.sender, item.expand.sender.avatar)
                            : `https://ui-avatars.com/api/?name=${item.sender_name || 'User'}&background=random`,
                        read: !!item.read_at
                    }));
                    
                    setMessages(realMessages);
                } catch (err) {
                    // Collection might not exist yet or empty
                    console.warn("Could not fetch messages:", err);
                    setMessages([]);
                }

            } catch (err) {
                console.error("Failed to load messages", err);
                setMessages([]);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [role]);

    return { messages, loading };
};
