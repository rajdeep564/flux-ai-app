"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Key } from 'lucide-react';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export function ApiKeyInput({ onApiKeySet, currentApiKey }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState(currentApiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!currentApiKey);

  useEffect(() => {
    // Load API key from localStorage on mount
    const stored = localStorage.getItem('flux-api-key');
    if (stored && !currentApiKey) {
      setApiKey(stored);
      onApiKeySet(stored);
      setIsEditing(false);
    }
  }, [currentApiKey, onApiKeySet]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('flux-api-key', apiKey.trim());
      onApiKeySet(apiKey.trim());
      setIsEditing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('flux-api-key');
    onApiKeySet('');
    setIsEditing(true);
  };

  if (!isEditing && currentApiKey) {
    return (
      <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-green-400" />
              <span className="text-sm text-white">API Key configured</span>
              <span className="text-xs text-gray-200">
                (***{currentApiKey.slice(-4)})
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="text-gray-200 hover:text-white"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-red-300 hover:text-white hover:bg-red-600/20"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Key className="h-5 w-5" />
          Flux API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="text-white">
            API Key
          </Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Flux API key"
              className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-300 pr-10 backdrop-blur-sm"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-200 hover:text-white"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
          >
            Save API Key
          </Button>
          {currentApiKey && (
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="text-gray-200 hover:text-white"
            >
              Cancel
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-300">
          Your API key will be stored locally in your browser and used to authenticate with the Flux API.
        </p>
      </CardContent>
    </Card>
  );
}
