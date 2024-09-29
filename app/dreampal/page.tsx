'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

export default function DreamPal() {

    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrbXFvbXBvYW1pZ3phaGNna3d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcyNDUxNTYsImV4cCI6MjA0MjgyMTE1Nn0.bsTFtISKS2F0-jWfUy8SzTp8w112sodpaq4MbB4RlNM'

    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const prevChatMessagesRef = useRef<any[]>([]);
    const uuid = useRef<string | null>(null);
    const currentUrl = useRef<string>('');
    const isFirstPost = useRef<boolean>(true);
    const scenes = useRef<string>('');
    const scenesDes = useRef<string>('');

    const getCurrentIframeUrl = () => {
        const iframe = document.getElementById('myIframe') as HTMLIFrameElement;
        const iframeSrc = iframe.contentWindow?.location.href;

        if (iframeSrc !== currentUrl.current && iframeSrc?.includes('chatting')) {
            // url 变化
            currentUrl.current = iframeSrc || '';
            uuid.current = genUUID();
            isFirstPost.current = true;

            scenes.current = currentUrl.current.split('chatting/')[1]?.split('?')[0] || '';

            console.log('url发送变化：', uuid.current, currentUrl.current);
        } else if (!iframeSrc?.includes('chatting')) {
            uuid.current = null;
            scenes.current = '';
        }
        return iframeSrc;
    }


    const getIframeChat = () => {
        const currentUrl = getCurrentIframeUrl();
        if (currentUrl && currentUrl.includes('chatting')) {
            const iframe = document.getElementById('myIframe') as HTMLIFrameElement;
            const newChatMessages: any[] = [];

            const mainContent = iframe.contentDocument?.getElementsByClassName("messageWrap_E5GAU")

            if (mainContent && mainContent.length > 0) {
                console.log('聊天介绍', mainContent[0].childNodes[1].textContent)
                scenesDes.current = mainContent[0].childNodes[1].textContent || '';
                //chat data
                for (let i = 2; i < mainContent[0].childNodes.length; i++) {
                    const node = mainContent[0].childNodes[i] as Element;
                    const agentBox = node.querySelector('.boxWrap_aKEl8') as HTMLElement;
                    const isAgent = agentBox?.style.flexDirection === 'row';
                    const content = node.querySelector('.contentRender_VMVOl')?.textContent || '';

                    const chatMessage = {
                        role: isAgent ? 'Agent' : 'User',
                        content: content
                    };
                    newChatMessages.push(chatMessage);
                }
            }
            setChatMessages(newChatMessages);
            console.log(newChatMessages);
        }
    }

    const handlePostMsg = useCallback(
        debounce(async (messages: any[]) => {
            if (uuid.current && isFirstPost.current) {
                //作为新的row插入
                console.log(22222)
                try {
                    const response = await fetch('https://ikmqompoamigzahcgkwv.supabase.co/rest/v1/dreampal', {
                        method: 'POST',
                        headers: {
                            'apikey': anonKey,
                            'Authorization': `Bearer ${anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            local_uuid: uuid.current,
                            scenes: scenes.current,
                            scenes_des: scenesDes.current,
                            chats: JSON.stringify(messages)
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to insert new row');
                    }
                    // console.log('New row inserted successfully');
                } catch (error) {
                    // console.error('Error inserting new row:', error);
                }
            } else {
                //更新当前uuid的row
                console.log(777777)
                try {
                    const response = await fetch(`https://ikmqompoamigzahcgkwv.supabase.co/rest/v1/dreampal?local_uuid=eq.${uuid.current}`, {
                        method: 'PATCH',
                        headers: {
                            'apikey': anonKey,
                            'Authorization': `Bearer ${anonKey}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal'
                        },
                        body: JSON.stringify({
                            chats: JSON.stringify(messages)
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to insert new row');
                    }
                    // console.log('row updated successfully');
                } catch (error) {
                    // console.error('Error inserting new row:', error);
                }
            }

            isFirstPost.current = false;
        }, 5000),
        []
    );

    const genUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    useEffect(() => {
        const intervalId = setInterval(() => {
            getCurrentIframeUrl();
            getIframeChat();
        }, 2000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (chatMessages.length > 0 && !isEqual(chatMessages, prevChatMessagesRef.current)) {
            handlePostMsg(chatMessages);
            prevChatMessagesRef.current = chatMessages;
        }
    }, [chatMessages, handlePostMsg]);

    return (
        <div id='xxx' className="w-full h-screen flex items-center justify-start gap-2 bg-zinc-700">
            <iframe id="myIframe" className="w-full h-full overflow-hidden" src={"/"} />
        </div>
    );
}