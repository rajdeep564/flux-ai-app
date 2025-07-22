"use client"

import React from 'react';
import { AlertTriangle, Info, Shield, Copyright } from 'lucide-react';
import { Card, CardContent } from './card';
import { Badge } from './badge';

interface ModerationInfoProps {
  reasons: string[];
  className?: string;
}

export function ModerationInfo({ reasons, className = '' }: ModerationInfoProps) {
  const getModerationIcon = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'derivative works filter':
        return <Copyright className="h-4 w-4 text-orange-500" />;
      default:
        return <Shield className="h-4 w-4 text-red-500" />;
    }
  };

  const getModerationDescription = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'derivative works filter':
        return 'This filter prevents generating content that closely copies or is directly based on existing copyrighted material to respect intellectual property rights.';
      case 'nsfw filter':
        return 'This filter blocks content that may be inappropriate or not safe for work.';
      case 'violence filter':
        return 'This filter prevents generation of violent or harmful content.';
      case 'hate speech filter':
        return 'This filter blocks content that may contain hate speech or discriminatory language.';
      default:
        return 'This content was flagged by our moderation system to ensure safe and appropriate image generation.';
    }
  };

  const getModerationSuggestion = (reason: string) => {
    switch (reason.toLowerCase()) {
      case 'derivative works filter':
        return 'Try creating original content instead of referencing specific characters, brands, or copyrighted works.';
      case 'nsfw filter':
        return 'Please use appropriate language and avoid suggestive or explicit content.';
      case 'violence filter':
        return 'Consider using peaceful or non-violent alternatives in your prompt.';
      case 'hate speech filter':
        return 'Please use respectful language that doesn\'t target any groups or individuals.';
      default:
        return 'Please modify your prompt to use more appropriate language and content.';
    }
  };

  return (
    <Card className={`bg-orange-900/20 border-orange-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="text-sm font-medium text-orange-200 mb-1">
                Content Moderated
              </h3>
              <p className="text-sm text-orange-300">
                Your request was reviewed by our content moderation system and couldn't be processed.
              </p>
            </div>

            <div className="space-y-3">
              {reasons.map((reason, index) => (
                <div key={index} className="bg-orange-900/30 rounded-lg p-3 border border-orange-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    {getModerationIcon(reason)}
                    <Badge variant="outline" className="text-xs border-orange-700 text-orange-300">
                      {reason}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <Info className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-orange-200">
                        <strong>What this means:</strong> {getModerationDescription(reason)}
                      </p>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Info className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                      <p className="text-orange-200">
                        <strong>Suggestion:</strong> {getModerationSuggestion(reason)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-900/30 rounded-lg p-3 border border-blue-800/50">
              <h4 className="text-xs font-medium text-blue-200 mb-1">💡 Tips for Success</h4>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Use original, creative descriptions instead of referencing specific brands or characters</li>
                <li>• Focus on artistic styles, colors, and compositions rather than copyrighted content</li>
                <li>• Describe scenes, emotions, and atmospheres in your own words</li>
                <li>• Try phrases like "in the style of" rather than naming specific artists or works</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
