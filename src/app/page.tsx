"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Send, MoreHorizontal, ImageIcon, Settings, Download, Copy, Trash2, Expand } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToastContainer, useToast } from "@/components/ui/toast"
import { ImageModal } from "@/components/ui/image-modal"
import { ModerationInfo } from "@/components/ui/moderation-info"
import { ApiKeyInput } from "@/components/api-key-input"
import { useFluxAPI } from "@/hooks/useFluxAPI"
import { FluxModel, AspectRatio, GeneratedImage, ImageStorageService } from "@/lib/flux-api"

export default function FluxAIGenerator() {
  const [selectedModel, setSelectedModel] = useState<FluxModel>("flux-kontext-pro")
  const [prompt, setPrompt] = useState("")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>("1:1")
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>("")
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [apiKey, setApiKey] = useState<string>("")
  const [showApiConfig, setShowApiConfig] = useState(false)
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Initialize toast system
  const { toasts, addToast, removeToast } = useToast()

  // Initialize the Flux API hook
  const {
    generateImage,
    isGenerating,
    generationProgress,
    error,
    getStoredImages,
    clearAllImages,
  } = useFluxAPI({ apiKey })

  // Load API key and stored images on mount
  useEffect(() => {
    const storedApiKey = localStorage.getItem('flux-api-key')
    const envApiKey = process.env.NEXT_PUBLIC_FLUX_API_KEY

    if (storedApiKey) {
      setApiKey(storedApiKey)
    } else if (envApiKey) {
      setApiKey(envApiKey)
    }
  }, [])

  // Load stored images when API key changes
  useEffect(() => {
    if (apiKey) {
      const loadImages = async () => {
        try {
          const stored = await getStoredImages()
          setGeneratedImages(stored)
        } catch (error) {
          console.error('Error loading stored images:', error)
        }
      }
      loadImages()
    }
  }, [getStoredImages, apiKey])

  const aspectRatios: AspectRatio[] = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16", "9:21"]

  // Helper function to parse moderation errors
  const parseModerationError = (errorMessage: string): string[] | null => {
    if (errorMessage.includes('Request was moderated:')) {
      const reasonsMatch = errorMessage.match(/Request was moderated: (.+?)\. Please try/);
      if (reasonsMatch) {
        return reasonsMatch[1].split(', ').map(reason => reason.trim());
      }
    }
    return null;
  };

  // Helper functions for image actions
  const expandImage = (image: GeneratedImage) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
  }

  const downloadImage = (image: GeneratedImage) => {
    try {
      // Create a download link
      const link = document.createElement('a')
      link.href = image.url
      link.download = `flux-${image.model}-${image.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      addToast('Image downloaded successfully!', 'success')
    } catch (error) {
      console.error('Error downloading image:', error)
      addToast('Failed to download image', 'error')
    }
  }

  const copyPrompt = async (prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      addToast('Prompt copied to clipboard!', 'success')
    } catch (error) {
      console.error('Error copying prompt:', error)
      addToast('Failed to copy prompt', 'error')
    }
  }

  const deleteImage = async (imageId: string) => {
    try {
      // Remove from UI immediately
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId))

      // Delete from server
      await ImageStorageService.deleteImage(imageId)

      addToast('Image deleted successfully', 'info')
    } catch (error) {
      console.error('Error deleting image:', error)
      addToast('Failed to delete image', 'error')

      // Reload images to restore UI state if server delete failed
      try {
        const stored = await getStoredImages()
        setGeneratedImages(stored)
      } catch (reloadError) {
        console.error('Error reloading images:', reloadError)
      }
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedImage(file)
      const url = URL.createObjectURL(file)
      setUploadedImageUrl(url)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    if (!apiKey) {
      setShowApiConfig(true)
      return
    }

    try {
      const result = await generateImage({
        model: selectedModel,
        prompt: prompt.trim(),
        aspectRatio: selectedAspectRatio,
        inputImage: uploadedImage,
      })

      if (result) {
        // Add the new image to the list
        setGeneratedImages((prev) => [result, ...prev])
        setPrompt("")
        setUploadedImage(null)
        setUploadedImageUrl("")
      }
    } catch (error) {
      console.error('Generation failed:', error)
    }
  }

  const getAspectRatioClass = (ratio: AspectRatio) => {
    const ratioMap = {
      "21:9": "aspect-[21/9]",
      "16:9": "aspect-video",
      "4:3": "aspect-[4/3]",
      "1:1": "aspect-square",
      "3:4": "aspect-[3/4]",
      "9:16": "aspect-[9/16]",
      "9:21": "aspect-[9/21]",
    }
    return ratioMap[ratio]
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ImageModal
        image={selectedImage}
        isOpen={isModalOpen}
        onClose={closeModal}
        onDownload={downloadImage}
        onCopy={copyPrompt}
        onDelete={deleteImage}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-white">FLUX AI Image Generator</h1>
          <p className="text-gray-200">Generate stunning images with FLUX.1 Kontext models</p>
        </div>

        <Tabs defaultValue={!apiKey ? "config" : "generate"} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
            <TabsTrigger value="config" className="flex items-center gap-2 text-gray-200 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
            <TabsTrigger value="generate" className="flex items-center gap-2 text-gray-200 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <ImageIcon className="h-5 w-5" />
              Generate
            </TabsTrigger>
            <TabsTrigger value="library" className="flex items-center gap-2 text-gray-200 data-[state=active]:bg-gray-700 data-[state=active]:text-white">
              <ImageIcon className="h-4 w-4" />
              Library ({generatedImages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">API Configuration</h2>
              <p className="text-gray-200">Configure your Flux API key to start generating images</p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm">
              <ApiKeyInput onApiKeySet={setApiKey} currentApiKey={apiKey} />
            </div>
          </TabsContent>

          <TabsContent value="generate" className="space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <ImageIcon className="h-5 w-5 text-white" />
                <h1 className="text-lg font-medium text-white">Generate images from text and references</h1>
              </div>
            </div>

            {/* Main Input Area */}
            <div className="relative">
              <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  {/* Upload Button */}
                  <div className="flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-10 w-10 p-0 bg-gray-800 hover:bg-gray-700 border border-gray-700"
                    >
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <ImageIcon className="h-4 w-4" />
                      </label>
                    </Button>
                  </div>

                  {/* Text Input */}
                  <div className="flex-1">
                    <Textarea
                      placeholder="Enter a text prompt to describe your desired image..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[60px] bg-transparent border-none resize-none text-white placeholder:text-gray-300 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                    />

                    {/* Uploaded Image Preview */}
                    {uploadedImageUrl && (
                      <div className="mt-4 relative inline-block">
                        <img
                          src={uploadedImageUrl || "/placeholder.svg"}
                          alt="Uploaded reference"
                          className="h-20 w-20 object-cover rounded-lg border border-gray-700"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedImage(null)
                            setUploadedImageUrl("")
                          }}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-gray-800 hover:bg-gray-700 rounded-full"
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Right Side Controls */}
                  <div className="flex items-center gap-2">
                    {/* Model Selection */}
                    <Select value={selectedModel} onValueChange={(value: FluxModel) => setSelectedModel(value)}>
                      <SelectTrigger className="bg-gray-700/50 border-gray-600 text-white hover:bg-gray-700 min-w-[180px] backdrop-blur-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="flux-kontext-pro" className="text-white hover:bg-gray-700">
                          FLUX.1 Kontext [pro]
                        </SelectItem>
                        <SelectItem value="flux-kontext-max" className="text-white hover:bg-gray-700">
                          FLUX.1 Kontext [max]
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Aspect Ratio Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 p-0 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 backdrop-blur-sm"
                        >
                          <MoreHorizontal className="h-4 w-4 text-white" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <div className="px-2 py-1 text-xs font-medium text-gray-300">Aspect Ratio</div>
                        {aspectRatios.map((ratio) => (
                          <DropdownMenuItem
                            key={ratio}
                            onClick={() => setSelectedAspectRatio(ratio)}
                            className={`text-white hover:bg-gray-700 ${selectedAspectRatio === ratio ? "bg-gray-700" : ""}`}
                          >
                            {ratio}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating || !apiKey}
                      className="h-10 w-10 p-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full disabled:opacity-50 shadow-lg"
                      title={!apiKey ? "Configure API key first" : "Generate image"}
                    >
                      {isGenerating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Current Settings Display */}
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-300">
                <span>
                  Model: {selectedModel === "flux-kontext-pro" ? "FLUX.1 Kontext [pro]" : "FLUX.1 Kontext [max]"}
                </span>
                <span>•</span>
                <span>Aspect Ratio: {selectedAspectRatio}</span>
                {uploadedImage && (
                  <>
                    <span>•</span>
                    <span>Reference: {uploadedImage.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Generation Status */}
            {isGenerating && (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-gray-900 rounded-full border border-gray-800">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-300">
                    {generationProgress || "Generating your image..."}
                  </span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="py-4">
                {(() => {
                  const moderationReasons = parseModerationError(error);
                  if (moderationReasons) {
                    return (
                      <ModerationInfo
                        reasons={moderationReasons}
                        className="max-w-2xl mx-auto"
                      />
                    );
                  }
                  return (
                    <div className="text-center">
                      <div className="inline-flex items-center gap-3 px-4 py-2 bg-red-900/20 border border-red-800 rounded-lg">
                        <span className="text-sm text-red-300">
                          Error: {error}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* API Key Warning */}
            {!apiKey && (
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                  <span className="text-sm text-yellow-300">
                    Please configure your API key in the Config tab to start generating images.
                  </span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="library">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Generated Images</h2>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">
                    {generatedImages.length} images
                  </Badge>
                  {generatedImages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete all images? This action cannot be undone.')) {
                          try {
                            setGeneratedImages([])
                            await clearAllImages()
                            addToast('All images cleared successfully', 'info')
                          } catch (error) {
                            console.error('Error clearing images:', error)
                            addToast('Failed to clear all images', 'error')
                            // Reload images to restore UI state
                            try {
                              const stored = await getStoredImages()
                              setGeneratedImages(stored)
                            } catch (reloadError) {
                              console.error('Error reloading images:', reloadError)
                            }
                          }
                        }
                      }}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>

              {generatedImages.length === 0 ? (
                <Card className="bg-gray-900 border-gray-800">
                  <CardContent className="p-12 text-center">
                    <ImageIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">No images generated yet</h3>
                    <p className="text-gray-500">Start generating images to build your library</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generatedImages.map((image) => (
                    <Card
                      key={image.id}
                      className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-colors"
                    >
                      <div
                        className={`relative group ${getAspectRatioClass(image.aspectRatio)} cursor-pointer`}
                        onClick={() => expandImage(image)}
                      >
                        <img
                          src={image.url || "/placeholder.svg"}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                        {/* Hover overlay with action buttons */}
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              expandImage(image)
                            }}
                            className="bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-500/30"
                            title="View full size"
                          >
                            <Expand className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadImage(image)
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                            title="Download image"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              copyPrompt(image.prompt)
                            }}
                            className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
                            title="Copy prompt"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteImage(image.id)
                            }}
                            className="bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30"
                            title="Delete image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-300 mb-2 line-clamp-2">{image.prompt}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                            {image.model === "flux-kontext-pro" ? "Pro" : "Max"}
                          </Badge>
                          <span>{image.aspectRatio}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-600">{image.timestamp.toLocaleDateString()}</p>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => expandImage(image)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-blue-400"
                              title="View full size"
                            >
                              <Expand className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadImage(image)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              title="Download"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyPrompt(image.prompt)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              title="Copy prompt"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteImage(image.id)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
