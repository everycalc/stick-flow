import React, { useState, useRef } from 'react';
import { Camera, Mic, Trash2, StopCircle } from 'lucide-react';
import { Attachment } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface AttachmentManagerProps {
    attachments: Attachment[];
    setAttachments: (attachments: Attachment[]) => void;
}

const AttachmentManager: React.FC<AttachmentManagerProps> = ({ attachments, setAttachments }) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleTakePhoto = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newAttachment: Attachment = {
                    id: `att-${Date.now()}`,
                    type: 'photo',
                    data: e.target?.result as string,
                    timestamp: new Date().toISOString(),
                };
                setAttachments([...attachments, newAttachment]);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    const newAttachment: Attachment = {
                        id: `att-${Date.now()}`,
                        type: 'voice',
                        data: audioUrl,
                        timestamp: new Date().toISOString(),
                    };
                    setAttachments([...attachments, newAttachment]);
                    audioChunksRef.current = [];
                    stream.getTracks().forEach(track => track.stop()); // Release microphone
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Microphone access was denied. Please allow microphone access in your browser settings.");
            }
        }
    };

    const removeAttachment = (id: string) => {
        setAttachments(attachments.filter(att => att.id !== id));
    };

    const renderAttachment = (att: Attachment) => {
        switch(att.type) {
            case 'photo':
                return <img src={att.data} alt="Attachment" className="w-24 h-24 object-cover rounded-lg" />;
            case 'voice':
                return <audio controls src={att.data} className="w-full h-10" />;
            default:
                return null;
        }
    };

    return (
        <div className="mt-2 space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={handleTakePhoto} type="button" className="flex items-center gap-2 text-sm px-4 py-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition">
                    <Camera size={18} /> {t('attachments.add_photo')}
                </button>
                <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={handleToggleRecording} type="button" className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full transition ${isRecording ? 'bg-red-500/20 text-red-700 dark:text-red-200' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}>
                    {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                    {isRecording ? t('attachments.stop_recording') : t('attachments.record_voice')}
                </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {attachments.map(att => (
                    <div key={att.id} className="relative group p-2 border border-light-outline/50 dark:border-dark-outline/50 rounded-lg">
                        {renderAttachment(att)}
                        <button onClick={() => removeAttachment(att.id)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AttachmentManager;
