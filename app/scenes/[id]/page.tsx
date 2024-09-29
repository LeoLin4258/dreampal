'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function Scene() {
    const params = useParams();
    const [sceneId, setSceneId] = useState<string | null>(null);

    useEffect(() => {
        if (params.id) {
            setSceneId(params.id as string);
        }
    }, [params.id]);

    return (
        <iframe src={`/hong-proxy/scenes/${sceneId}`} className='w-full h-screen' />
    );
}