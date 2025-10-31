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
  const [isPremium, setIsPremium] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
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

  const startCamera = async (mode: 'photo' | 'translate' | 'solve') => {
    setCameraMode(mode);
    setShowActionMenu(false);
    
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
  };

  const openFileSelect = (mode: 'photo' | 'translate' | 'solve') => {
    setCameraMode(mode);
    setShowActionMenu(false);
    fileInputRef.current?.click();
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showActionMenu && !target.closest('.action-menu-container')) {
        setShowActionMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

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
        const imageData = reader.result as string;
        setSelectedImage(imageData);
        
        let prompt = '';
        if (cameraMode === 'translate') {
          prompt = 'Переведи весь текст с этого изображения на русский язык. Сохрани форматирование.';
        } else if (cameraMode === 'solve') {
          prompt = 'Реши все задачи и примеры с этого изображения. Покажи подробное решение.';
        }
        
        if (prompt) {
          setInputValue(prompt);
        }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl">
            <Icon name="Sparkles" size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-500 drop-shadow-lg">
              НОВЫЙ ИИ ПОМОЩНИК
            </h1>
            <h2 className="text-6xl font-black text-white drop-shadow-lg tracking-wide">
              DELTA
            </h2>
          </div>
          <p className="text-gray-400 text-lg">
            Твой персональный ассистент с искусственным интеллектом
          </p>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => {
                setShowWelcome(false);
                setIsPremium(false);
              }}
              size="lg"
              className="bg-white text-black hover:bg-gray-200 font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl"
            >
              Начать
            </Button>
            <Button
              onClick={() => {
                setShowWelcome(false);
                setIsPremium(true);
              }}
              size="lg"
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black hover:opacity-90 font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl flex items-center gap-2 justify-center"
            >
              <span>✨</span>
              Delta+
              <span>✨</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      isPremium 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10'
    }`}>
      <header className={`backdrop-blur-md border-b sticky top-0 z-10 ${
        isPremium 
          ? 'bg-black/80 border-gray-800' 
          : 'bg-white/80 border-border'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isPremium 
                ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600' 
                : 'bg-gradient-to-br from-primary via-secondary to-accent'
            }`}>
              <Icon name="Sparkles" size={20} className={isPremium ? 'text-black' : 'text-white'} />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                isPremium 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent' 
                  : 'bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent'
              }`}>
                Delta AI {isPremium && '+'}
              </h1>
              <p className={`text-xs ${
                isPremium ? 'text-gray-500' : 'text-muted-foreground'
              }`}>
                {isPremium ? 'Премиум режим' : 'Твой умный ассистент'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPremium(!isPremium)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                isPremium 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:opacity-90' 
                  : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
              }`}
            >
              {isPremium ? '✨ Premium' : 'Delta+'}
            </button>
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity shadow-md ${
                  isPremium 
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' 
                    : 'bg-gradient-to-br from-primary via-secondary to-accent'
                }`}
                aria-label="Установить приложение"
              >
                <Icon name="Smartphone" size={20} className={isPremium ? 'text-black' : 'text-white'} />
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
            <div className="px-4 py-2 rounded-full text-white font-medium bg-white/20 backdrop-blur-md">
              {cameraMode === 'photo' && '📸 Фото'}
              {cameraMode === 'translate' && '🌐 Перевод текста'}
              {cameraMode === 'solve' && '🧮 Решение задач'}
            </div>
            <div className="w-10" />
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
              <p className="text-white text-sm text-center">📱 Наведите камеру на текст для перевода</p>
            )}
            {cameraMode === 'solve' && (
              <p className="text-white text-sm text-center">🧮 Наведите камеру на задачу для решения</p>
            )}
            {cameraMode === 'photo' && (
              <p className="text-white text-sm text-center">📸 Сделайте фото для анализа</p>
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
                className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm hover:shadow-md transition-shadow ${
                  message.sender === 'user'
                    ? isPremium 
                      ? 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 text-black'
                      : 'bg-gradient-to-br from-primary to-secondary text-white'
                    : isPremium
                      ? 'bg-gray-800 border border-gray-700 text-gray-100'
                      : 'bg-white border border-border'
                }`}
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
              <Card className={`rounded-2xl px-5 py-3 shadow-sm ${
                isPremium 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-border'
              }`}>
                <div className="flex gap-1.5">
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isPremium ? 'bg-yellow-500/60' : 'bg-primary/60'
                  }`} style={{ animationDelay: '0s' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isPremium ? 'bg-yellow-500/60' : 'bg-secondary/60'
                  }`} style={{ animationDelay: '0.2s' }} />
                  <div className={`w-2 h-2 rounded-full animate-bounce ${
                    isPremium ? 'bg-yellow-500/60' : 'bg-accent/60'
                  }`} style={{ animationDelay: '0.4s' }} />
                </div>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className={`backdrop-blur-md border-t sticky bottom-0 ${
        isPremium 
          ? 'bg-black/80 border-gray-800' 
          : 'bg-white/80 border-border'
      }`}>
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
            <div className="relative action-menu-container">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isPremium 
                    ? 'bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 hover:from-yellow-400/30 hover:to-yellow-600/30 border border-yellow-500/30' 
                    : 'bg-gradient-to-br from-primary/10 to-secondary/10 hover:from-primary/20 hover:to-secondary/20 border border-primary/20'
                }`}
                aria-label="Открыть меню действий"
              >
                <Icon name="Plus" size={20} className={isPremium ? 'text-yellow-500' : 'text-primary'} />
              </button>
              
              {showActionMenu && (
                <div className={`absolute bottom-full left-0 mb-2 w-64 rounded-2xl shadow-2xl overflow-hidden animate-fade-in ${
                  isPremium 
                    ? 'bg-gray-900 border border-gray-700' 
                    : 'bg-white border-border'
                }`}>
                  <button
                    onClick={() => openFileSelect('photo')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
                      isPremium ? 'hover:bg-yellow-500/10' : 'hover:bg-primary/5'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">📷</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Выбрать фото</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Описать содержимое</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => startCamera('photo')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-t ${
                      isPremium 
                        ? 'hover:bg-yellow-500/10 border-gray-800' 
                        : 'hover:bg-primary/5 border-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xl">📸</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Сфотографировать</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Открыть камеру</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => openFileSelect('translate')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-t ${
                      isPremium 
                        ? 'hover:bg-yellow-500/10 border-gray-800' 
                        : 'hover:bg-primary/5 border-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xl">🌐</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Перевести текст</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Из галереи</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => startCamera('translate')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-t ${
                      isPremium 
                        ? 'hover:bg-yellow-500/10 border-gray-800' 
                        : 'hover:bg-primary/5 border-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xl">📱</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Перевести с камеры</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Навести на текст</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => openFileSelect('solve')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-t ${
                      isPremium 
                        ? 'hover:bg-yellow-500/10 border-gray-800' 
                        : 'hover:bg-primary/5 border-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xl">🧮</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Решить задачу</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Из галереи</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => startCamera('solve')}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left border-t ${
                      isPremium 
                        ? 'hover:bg-yellow-500/10 border-gray-800' 
                        : 'hover:bg-primary/5 border-border'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-xl">📐</span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        isPremium ? 'text-gray-100' : 'text-foreground'
                      }`}>Решить с камеры</p>
                      <p className={`text-xs ${
                        isPremium ? 'text-gray-500' : 'text-muted-foreground'
                      }`}>Навести на задачу</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Напиши сообщение Delta AI..."
                className={`pr-12 h-12 rounded-2xl border-2 transition-colors ${
                  isPremium 
                    ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500/50' 
                    : 'focus:border-primary/50'
                }`}
              />
              {inputValue && (
                <button
                  onClick={() => setInputValue('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isPremium 
                      ? 'text-gray-500 hover:text-gray-300' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon name="X" size={18} />
                </button>
              )}
            </div>
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`h-12 px-6 rounded-2xl hover:opacity-90 transition-opacity ${
                isPremium 
                  ? 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black' 
                  : 'bg-gradient-to-r from-primary via-secondary to-accent'
              }`}
            >
              <Icon name="Send" size={20} />
            </Button>
          </div>
          <p className={`text-xs text-center mt-2 ${
            isPremium ? 'text-gray-600' : 'text-muted-foreground'
          }`}>
            Delta AI может совершать ошибки. Проверяйте важную информацию.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;