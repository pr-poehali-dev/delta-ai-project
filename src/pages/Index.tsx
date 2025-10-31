import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  image?: string;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Привет! Я Delta AI — твой персональный ассистент. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'translate' | 'solve'>('photo');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    
    setDeferredPrompt(null);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Ваш браузер не поддерживает доступ к камере. Попробуйте использовать Chrome, Safari или Firefox.');
        return;
      }

      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
          });
        }
      }, 100);
    } catch (error: any) {
      console.error('Camera access error:', error);
      let errorMessage = 'Не удалось получить доступ к камере. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Разрешите доступ к камере в настройках браузера.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Камера не найдена на устройстве.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Камера уже используется другим приложением.';
      } else {
        errorMessage += 'Проверьте настройки браузера и попробуйте снова.';
      }
      
      alert(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setCameraMode('photo');
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        
        let prompt = '';
        if (cameraMode === 'translate') {
          prompt = 'Переведи весь текст с этого изображения на русский язык. Сохрани форматирование.';
        } else if (cameraMode === 'solve') {
          prompt = 'Реши все задачи и примеры с этого изображения. Покажи подробное решение.';
        }
        
        setSelectedImage(imageData);
        if (prompt) {
          setInputValue(prompt);
        }
        stopCamera();
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue || 'Изображение',
      sender: 'user',
      timestamp: new Date(),
      image: selectedImage || undefined,
    };

    const messageText = inputValue;
    const imageData = selectedImage;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const response = await fetch('https://functions.poehali.dev/eac8d005-123d-455d-9902-f25c4126f756', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: messageText,
          image: imageData 
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Извини, произошла ошибка. Попробуй ещё раз!',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Icon name="Sparkles" size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">
              НОВЫЙ ИИ ПОМОЩНИК
            </h1>
            <h2 className="text-6xl font-black text-white drop-shadow-lg tracking-wide">
              DELTA
            </h2>
          </div>
          <p className="text-white/90 text-lg">
            Твой персональный ассистент с искусственным интеллектом
          </p>
          <Button
            onClick={() => setShowWelcome(false)}
            size="lg"
            className="bg-white text-primary hover:bg-white/90 font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl"
          >
            Начать
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
              <Icon name="Sparkles" size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Delta AI
              </h1>
              <p className="text-xs text-muted-foreground">Твой умный ассистент</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={startCamera}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
              aria-label="Открыть камеру"
            >
              <Icon name="Camera" size={20} className="text-white" />
            </button>
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center hover:opacity-90 transition-opacity shadow-md"
                aria-label="Установить приложение"
              >
                <Icon name="Smartphone" size={20} className="text-white" />
              </button>
            )}
          </div>
        </div>
      </header>

      {showCamera && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/50">
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
            >
              <Icon name="X" size={24} className="text-white" />
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setCameraMode('photo')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  cameraMode === 'photo'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white backdrop-blur-md'
                }`}
              >
                📸 Фото
              </button>
              <button
                onClick={() => setCameraMode('translate')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  cameraMode === 'translate'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white backdrop-blur-md'
                }`}
              >
                🌐 Перевод
              </button>
              <button
                onClick={() => setCameraMode('solve')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  cameraMode === 'solve'
                    ? 'bg-white text-black'
                    : 'bg-white/20 text-white backdrop-blur-md'
                }`}
              >
                🧮 Решить
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-6 bg-black/50 flex flex-col items-center gap-3">
            {cameraMode === 'translate' && (
              <p className="text-white text-sm text-center">📱 Наведите на текст для перевода</p>
            )}
            {cameraMode === 'solve' && (
              <p className="text-white text-sm text-center">🧮 Наведите на задачу для решения</p>
            )}
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full border-4 border-black" />
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div
                className={`max-w-[80%] ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-primary to-secondary text-white'
                    : 'bg-white border border-border'
                } rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-shadow`}
              >
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Прикрепленное изображение" 
                    className="rounded-xl mb-2 max-w-full h-auto"
                  />
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="text-xs opacity-60 mt-1 block">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <Card className="bg-white border border-border rounded-2xl px-5 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 bg-secondary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-accent/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white/80 backdrop-blur-md border-t border-border sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {selectedImage && (
            <div className="mb-3 relative inline-block">
              <img 
                src={selectedImage} 
                alt="Выбранное изображение" 
                className="rounded-xl max-h-32 border-2 border-primary/30"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center hover:from-primary/20 hover:to-secondary/20 transition-all border border-primary/20"
              aria-label="Прикрепить изображение"
            >
              <Icon name="Plus" size={20} className="text-primary" />
            </button>
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напиши сообщение Delta AI..."
                className="pr-12 h-12 rounded-2xl border-2 focus:border-primary/50 transition-colors"
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon name="X" size={18} />
                </button>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className="h-12 px-6 rounded-2xl bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
            >
              <Icon name="Send" size={20} />
            </Button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Delta AI может совершать ошибки. Проверяйте важную информацию.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;