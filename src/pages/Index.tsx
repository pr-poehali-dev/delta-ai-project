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
  sources?: string[];
  searchQuery?: string;
}

interface Settings {
  voiceEnabled: boolean;
  darkTheme: boolean;
  animationsEnabled: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Привет! Я Delta AI — твой персональный ассист. Чем могу помочь?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'translate' | 'solve'>('photo');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [settings, setSettings] = useState<Settings>({
    voiceEnabled: true,
    darkTheme: true,
    animationsEnabled: true,
  });
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

  const speakText = (text: string) => {
    if (!settings.voiceEnabled || !window.speechSynthesis) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    alert('Сообщение скопировано!');
  };

  const forwardMessage = (content: string) => {
    setInputValue(content);
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
            console.error('Ошибка воспроизведения видео:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Ошибка доступа к камере:', error);
      alert('Не удалось получить доступ к камере. Проверьте разрешения в настройках браузера.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      stopCamera();
      
      let prompt = '';
      if (cameraMode === 'translate') {
        prompt = 'Переведи текст на этом изображении на русский язык';
      } else if (cameraMode === 'solve') {
        prompt = 'Реши задачу на этом изображении';
      } else {
        prompt = 'Что на этом изображении?';
      }
      
      handleSendMessage(prompt, imageData);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async (text?: string, image?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText && !image) return;

    // Check for admin command
    if (messageText === '/adminPP') {
      setIsAdminMode(true);
      setInputValue('');
      const botMessage: Message = {
        id: Date.now().toString(),
        content: '🔐 Секретный премиум режим активирован! Теперь вы видите внутренний поиск ИИ и имеете расширенные возможности.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
      speakText(botMessage.content);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
      image: image || selectedImage || undefined,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const searchQuery = isAdminMode ? `🔍 Поиск: "${messageText.slice(0, 50)}..."` : undefined;
      
      const response = await fetch('https://functions.poehali.dev/a1a027d6-9a1d-4267-a1bc-c453da93fe8a', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || 'Извините, произошла ошибка при обработке запроса.',
        sender: 'bot',
        timestamp: new Date(),
        sources: data.sources || [],
        searchQuery,
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      speakText(botMessage.content);
    } catch (error) {
      console.error('Error calling AI:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Извините, произошла ошибка при соединении с AI. Попробуйте позже.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
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
            <h1 className="text-4xl font-bold text-gray-400 drop-shadow-lg">
              НОВЫЙ ИИ ПОМОЩНИК
            </h1>
            <h2 className="text-6xl font-black text-white drop-shadow-lg tracking-wide">
              DELTA
            </h2>
          </div>
          <p className="text-gray-400 text-lg">
            Твой персональный ассистент с искусственным интеллектом
          </p>
          <Button
            onClick={() => setShowWelcome(false)}
            size="lg"
            className="bg-white text-black hover:bg-gray-200 font-bold text-lg px-8 py-6 rounded-2xl shadow-2xl"
          >
            Начать
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${
      settings.darkTheme 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-black' 
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <header className={`backdrop-blur-md border-b sticky top-0 z-10 ${
        settings.darkTheme 
          ? 'bg-black/80 border-gray-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              settings.darkTheme 
                ? 'bg-gradient-to-br from-gray-700 to-gray-900' 
                : 'bg-gradient-to-br from-blue-500 to-purple-600'
            }`}>
              <Icon name="Sparkles" size={20} className="text-white" />
            </div>
            <div>
              <h1 className={`text-xl font-bold ${
                settings.darkTheme 
                  ? 'text-white' 
                  : 'text-gray-900'
              }`}>
                Delta AI {isAdminMode && '🔐'}
              </h1>
              <p className={`text-xs ${
                settings.darkTheme ? 'text-gray-500' : 'text-gray-500'
              }`}>
                {isAdminMode ? 'Премиум режим' : 'Персональный ассистент'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                settings.darkTheme 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Icon name="Settings" size={20} className={settings.darkTheme ? 'text-white' : 'text-gray-900'} />
            </button>
            {showInstallButton && (
              <button
                onClick={handleInstallClick}
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  settings.darkTheme 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Icon name="Download" size={20} className={settings.darkTheme ? 'text-white' : 'text-gray-900'} />
              </button>
            )}
          </div>
        </div>
      </header>

      {showSettings && (
        <div className={`absolute top-16 right-4 z-20 rounded-2xl shadow-2xl p-6 space-y-4 w-80 ${
          settings.darkTheme ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-bold ${settings.darkTheme ? 'text-white' : 'text-gray-900'}`}>
            Настройки
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={settings.darkTheme ? 'text-gray-300' : 'text-gray-700'}>
                Озвучка сообщений
              </span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, voiceEnabled: !prev.voiceEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.voiceEnabled 
                    ? 'bg-blue-600' 
                    : settings.darkTheme ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className={settings.darkTheme ? 'text-gray-300' : 'text-gray-700'}>
                Тёмная тема
              </span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, darkTheme: !prev.darkTheme }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.darkTheme 
                    ? 'bg-blue-600' 
                    : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.darkTheme ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className={settings.darkTheme ? 'text-gray-300' : 'text-gray-700'}>
                Анимации
              </span>
              <button
                onClick={() => setSettings(prev => ({ ...prev, animationsEnabled: !prev.animationsEnabled }))}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.animationsEnabled 
                    ? 'bg-blue-600' 
                    : settings.darkTheme ? 'bg-gray-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.animationsEnabled ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

          <Button
            onClick={() => setShowSettings(false)}
            className="w-full"
            variant="outline"
          >
            Закрыть
          </Button>
        </div>
      )}

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
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} ${
                settings.animationsEnabled ? 'animate-fade-in' : ''
              }`}
              style={settings.animationsEnabled ? { animationDelay: `${index * 0.1}s` } : {}}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-lg hover:shadow-xl transition-all ${
                  settings.animationsEnabled ? 'hover:scale-[1.02]' : ''
                } ${
                  message.sender === 'user'
                    ? settings.darkTheme
                      ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                    : settings.darkTheme
                      ? 'bg-gray-800 border border-gray-700 text-gray-100'
                      : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                {message.searchQuery && isAdminMode && (
                  <div className="mb-2 p-2 bg-black/20 rounded-lg text-xs">
                    {message.searchQuery}
                  </div>
                )}
                {message.image && (
                  <img 
                    src={message.image} 
                    alt="Прикрепленное изображение" 
                    className="rounded-xl mb-2 max-w-full h-auto"
                  />
                )}
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs opacity-60">
                    {message.timestamp.toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {message.sender === 'bot' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyMessage(message.content)}
                        className="p-1 hover:bg-black/10 rounded"
                      >
                        <Icon name="Copy" size={14} />
                      </button>
                      <button
                        onClick={() => forwardMessage(message.content)}
                        className="p-1 hover:bg-black/10 rounded"
                      >
                        <Icon name="Forward" size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {message.sources && message.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.sources.map((source, idx) => (
                      <span
                        key={idx}
                        className={`text-xs px-2 py-1 rounded ${
                          settings.darkTheme 
                            ? 'bg-gray-700 text-gray-300' 
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className={`rounded-2xl px-5 py-3 ${
                settings.darkTheme ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {selectedImage && (
        <div className="px-4">
          <div className="max-w-4xl mx-auto relative">
            <img 
              src={selectedImage} 
              alt="Выбранное изображение" 
              className="w-32 h-32 object-cover rounded-xl border-2 border-primary"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        </div>
      )}

      <footer className={`border-t backdrop-blur-md sticky bottom-0 ${
        settings.darkTheme 
          ? 'bg-black/80 border-gray-800' 
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <button
                onClick={() => setShowActionMenu(!showActionMenu)}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  settings.darkTheme 
                    ? 'bg-gray-800 hover:bg-gray-700' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Icon name="Plus" size={22} className={settings.darkTheme ? 'text-white' : 'text-gray-900'} />
              </button>
              
              {showActionMenu && (
                <div className={`absolute bottom-16 left-0 rounded-2xl shadow-2xl p-3 space-y-2 w-48 ${
                  settings.darkTheme ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl ${
                      settings.darkTheme 
                        ? 'hover:bg-gray-700 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <Icon name="Image" size={18} />
                    <span className="text-sm">Фото из галереи</span>
                  </button>
                  <button
                    onClick={() => startCamera('photo')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl ${
                      settings.darkTheme 
                        ? 'hover:bg-gray-700 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <Icon name="Camera" size={18} />
                    <span className="text-sm">Сделать фото</span>
                  </button>
                  <button
                    onClick={() => startCamera('translate')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl ${
                      settings.darkTheme 
                        ? 'hover:bg-gray-700 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <Icon name="Languages" size={18} />
                    <span className="text-sm">Перевести текст</span>
                  </button>
                  <button
                    onClick={() => startCamera('solve')}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl ${
                      settings.darkTheme 
                        ? 'hover:bg-gray-700 text-white' 
                        : 'hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    <Icon name="Calculator" size={18} />
                    <span className="text-sm">Решить задачу</span>
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Введите сообщение..."
              className={`flex-1 rounded-full h-12 text-base ${
                settings.darkTheme 
                  ? 'bg-gray-800 border-gray-700 text-white placeholder:text-gray-500' 
                  : 'bg-white border-gray-200'
              }`}
            />

            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() && !selectedImage}
              size="icon"
              className={`rounded-full w-12 h-12 ${
                settings.darkTheme 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              <Icon name="Send" size={20} className="text-white" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;