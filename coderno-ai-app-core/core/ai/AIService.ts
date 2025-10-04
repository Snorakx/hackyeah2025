import { AIConfig, AIPromptConfig, AISession, APIResponse } from '../types';

export class AIService {
  private config: AIConfig;
  private sessions: Map<string, AISession> = new Map();

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Generate AI response using configured prompt
   */
  async generateResponse(
    promptId: string,
    input: any,
    context: any = {},
    userId?: string
  ): Promise<APIResponse<any>> {
    try {
      const prompt = this.getPrompt(promptId);
      if (!prompt) {
        throw new Error(`Prompt with id ${promptId} not found`);
      }

      // Build user context
      const userContext = this.buildUserContext(prompt.userContextTemplate, context);
      
      // Prepare messages
      const messages = [
        {
          role: 'system',
          content: prompt.systemPrompt
        },
        {
          role: 'user',
          content: userContext
        }
      ];

      // Make API call
      const response = await this.callAIProvider(messages, prompt);
      
      // Parse response
      const parsedResponse = this.parseResponse(response, prompt.responseFormat);
      
      // Create session if userId provided
      if (userId) {
        const session: AISession = {
          id: this.generateSessionId(),
          userId,
          promptId,
          input,
          output: parsedResponse,
          context,
          timestamp: new Date().toISOString()
        };
        this.sessions.set(session.id, session);
      }

      return {
        success: true,
        data: parsedResponse
      };
    } catch (error: any) {
      console.error('AI Service Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get prompt configuration
   */
  getPrompt(promptId: string): AIPromptConfig | null {
    return this.config.prompts.find(p => p.id === promptId) || null;
  }

  /**
   * Get all prompts
   */
  getAllPrompts(): AIPromptConfig[] {
    return this.config.prompts;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): AISession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): AISession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  /**
   * Build user context from template
   */
  private buildUserContext(template: string, context: any): string {
    let userContext = template;
    
    // Replace placeholders with context values
    Object.entries(context).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      userContext = userContext.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return userContext;
  }

  /**
   * Call AI provider
   */
  private async callAIProvider(messages: any[], prompt: AIPromptConfig): Promise<any> {
    const requestBody = {
      model: this.getModelName(),
      messages,
      temperature: prompt.temperature || 0.1,
      max_tokens: prompt.maxTokens || 500
    };

    const response = await fetch(this.getAPIUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...this.getAdditionalHeaders()
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  /**
   * Get API URL based on provider
   */
  private getAPIUrl(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'https://api.openai.com/v1/chat/completions';
      case 'openrouter':
        return 'https://openrouter.ai/api/v1/chat/completions';
      case 'anthropic':
        return 'https://api.anthropic.com/v1/messages';
      default:
        throw new Error(`Unsupported AI provider: ${this.config.provider}`);
    }
  }

  /**
   * Get model name based on provider
   */
  private getModelName(): string {
    switch (this.config.provider) {
      case 'openai':
        return 'gpt-4o-mini';
      case 'openrouter':
        return 'openai/gpt-4o-mini';
      case 'anthropic':
        return 'claude-3-haiku-20240307';
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Get additional headers for API
   */
  private getAdditionalHeaders(): Record<string, string> {
    switch (this.config.provider) {
      case 'openrouter':
        return {
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'AI App Core'
        };
      default:
        return {};
    }
  }

  /**
   * Parse AI response based on format
   */
  private parseResponse(response: string, formatId: string): any {
    const format = this.config.responseFormats.find(f => f.id === formatId);
    if (!format) {
      // Try to parse as JSON
      try {
        return JSON.parse(response);
      } catch {
        return { raw: response };
      }
    }

    try {
      const parsed = JSON.parse(response);
      
      // Validate against schema if provided
      if (format.schema) {
        this.validateResponse(parsed, format.schema);
      }
      
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return { raw: response, error: 'Failed to parse response' };
    }
  }

  /**
   * Validate response against schema
   */
  private validateResponse(data: any, schema: any): void {
    // Basic validation - can be enhanced with JSON Schema library
    if (schema.type === 'object' && typeof data !== 'object') {
      throw new Error('Response must be an object');
    }
    
    if (schema.required) {
      schema.required.forEach((field: string) => {
        if (!(field in data)) {
          throw new Error(`Required field ${field} is missing`);
        }
      });
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AIConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get configuration
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }
}
