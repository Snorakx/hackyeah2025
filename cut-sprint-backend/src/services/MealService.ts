import { supabase } from '../lib/supabase';
import { Meal, MealItem, CreateMealRequest, MealSearchParams, NutritionInfo } from '../types';
import { ProductService } from './ProductService';
import assistantConfig from '../config/assistantConfig.json';

export class MealService {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Get meal by ID
   */
  async getMealById(mealId: string): Promise<Meal | null> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting meal:', error);
      return null;
    }
  }

  /**
   * Get meal with items
   */
  async getMealWithItems(mealId: string): Promise<{ meal: Meal; items: MealItem[] } | null> {
    try {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .single();

      if (mealError) throw mealError;

      const { data: items, error: itemsError } = await supabase
        .from('meal_items')
        .select('*')
        .eq('meal_id', mealId);

      if (itemsError) throw itemsError;

      return {
        meal,
        items: items || []
      };
    } catch (error) {
      console.error('Error getting meal with items:', error);
      return null;
    }
  }

  /**
   * Get meals for a user on a specific date
   */
  async getMealsByDate(userId: string, date: string): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('type');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting meals by date:', error);
      return [];
    }
  }

  /**
   * Get meals with search parameters
   */
  async getMeals(userId: string, params: MealSearchParams): Promise<Meal[]> {
    try {
      let query = supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId);

      if (params.date) {
        query = query.eq('date', params.date);
      }

      if (params.type) {
        query = query.eq('type', params.type);
      }

      query = query.order('date', { ascending: false });

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting meals:', error);
      return [];
    }
  }

  /**
   * Create new meal
   */
  async createMeal(userId: string, mealData: CreateMealRequest): Promise<Meal | null> {
    try {
      // Calculate total nutrition for the meal
      let totalCalories = 0;
      let totalProtein = 0;
      let totalFat = 0;
      let totalCarbs = 0;

      // Validate and calculate nutrition for each item
      for (const item of mealData.items) {
        const product = await this.productService.getProductById(item.product_id);
        if (!product) {
          throw new Error(`Product not found: ${item.product_id}`);
        }

        const nutrition = this.productService.calculateNutrition(product, item.quantity_grams);
        totalCalories += nutrition.calories;
        totalProtein += nutrition.protein;
        totalFat += nutrition.fat;
        totalCarbs += nutrition.carbs;
      }

      // Create meal
      const meal: Partial<Meal> = {
        user_id: userId,
        date: mealData.date,
        type: mealData.type,
        total_calories: totalCalories,
        total_protein: totalProtein,
        total_fat: totalFat,
        total_carbs: totalCarbs,
        notes: mealData.notes
      };

      const { data: mealResult, error: mealError } = await supabase
        .from('meals')
        .insert(meal)
        .select()
        .single();

      if (mealError) throw mealError;

      // Create meal items
      const mealItems = mealData.items.map(item => ({
        meal_id: mealResult.id,
        product_id: item.product_id,
        quantity_grams: item.quantity_grams,
        quantity_portions: item.quantity_portions || 1.0
      }));

      // Calculate nutrition for each item and insert
      for (const item of mealData.items) {
        const product = await this.productService.getProductById(item.product_id);
        if (product) {
          const nutrition = this.productService.calculateNutrition(product, item.quantity_grams);
          
          const mealItem: Partial<MealItem> = {
            meal_id: mealResult.id,
            product_id: item.product_id,
            quantity_grams: item.quantity_grams,
            quantity_portions: item.quantity_portions || 1.0,
            calories: nutrition.calories,
            protein: nutrition.protein,
            fat: nutrition.fat,
            carbs: nutrition.carbs
          };

          const { error: itemError } = await supabase
            .from('meal_items')
            .insert(mealItem);

          if (itemError) throw itemError;
        }
      }

      // Update daily summary
      await this.updateDailySummary(userId, mealData.date);

      return mealResult;
    } catch (error) {
      console.error('Error creating meal:', error);
      return null;
    }
  }

  /**
   * Update meal
   */
  async updateMeal(mealId: string, mealData: Partial<CreateMealRequest>): Promise<Meal | null> {
    try {
      // If items are being updated, recalculate nutrition
      if (mealData.items) {
        let totalCalories = 0;
        let totalProtein = 0;
        let totalFat = 0;
        let totalCarbs = 0;

        for (const item of mealData.items) {
          const product = await this.productService.getProductById(item.product_id);
          if (product) {
            const nutrition = this.productService.calculateNutrition(product, item.quantity_grams);
            totalCalories += nutrition.calories;
            totalProtein += nutrition.protein;
            totalFat += nutrition.fat;
            totalCarbs += nutrition.carbs;
          }
        }

        (mealData as any).total_calories = totalCalories;
        (mealData as any).total_protein = totalProtein;
        (mealData as any).total_fat = totalFat;
        (mealData as any).total_carbs = totalCarbs;
      }

      const { data, error } = await supabase
        .from('meals')
        .update(mealData)
        .eq('id', mealId)
        .select()
        .single();

      if (error) throw error;

      // Update daily summary if date is provided
      if (mealData.date) {
        await this.updateDailySummary(data.user_id, mealData.date);
      }

      return data;
    } catch (error) {
      console.error('Error updating meal:', error);
      return null;
    }
  }

  /**
   * Delete meal
   */
  async deleteMeal(mealId: string): Promise<boolean> {
    try {
      // Get meal to get user_id and date for daily summary update
      const meal = await this.getMealById(mealId);
      if (!meal) return false;

      // Delete meal items first
      const { error: itemsError } = await supabase
        .from('meal_items')
        .delete()
        .eq('meal_id', mealId);

      if (itemsError) throw itemsError;

      // Delete meal
      const { error: mealError } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId);

      if (mealError) throw mealError;

      // Update daily summary
      await this.updateDailySummary(meal.user_id, meal.date);

      return true;
    } catch (error) {
      console.error('Error deleting meal:', error);
      return false;
    }
  }

  /**
   * Get daily nutrition summary
   */
  async getDailyNutritionSummary(userId: string, date: string): Promise<NutritionInfo> {
    try {
      const meals = await this.getMealsByDate(userId, date);
      
      const summary: NutritionInfo = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      };

      meals.forEach(meal => {
        summary.calories += meal.total_calories;
        summary.protein += meal.total_protein;
        summary.fat += meal.total_fat;
        summary.carbs += meal.total_carbs;
      });

      return summary;
    } catch (error) {
      console.error('Error getting daily nutrition summary:', error);
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }
  }

  /**
   * Get weekly nutrition summary
   */
  async getWeeklyNutritionSummary(userId: string, startDate: string, endDate: string): Promise<NutritionInfo> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('total_calories, total_protein, total_fat, total_carbs')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const summary: NutritionInfo = {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      };

      data?.forEach(meal => {
        summary.calories += meal.total_calories;
        summary.protein += meal.total_protein;
        summary.fat += meal.total_fat;
        summary.carbs += meal.total_carbs;
      });

      return summary;
    } catch (error) {
      console.error('Error getting weekly nutrition summary:', error);
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }
  }

  /**
   * Duplicate yesterday's meals
   */
  async duplicateYesterdayMeals(userId: string, targetDate: string): Promise<boolean> {
    try {
      const yesterday = new Date(targetDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayMeals = await this.getMealsByDate(userId, yesterdayStr);
      
      for (const meal of yesterdayMeals) {
        const mealWithItems = await this.getMealWithItems(meal.id);
        if (mealWithItems) {
          const newMealData: CreateMealRequest = {
            date: targetDate,
            type: meal.type,
            items: mealWithItems.items.map(item => ({
              product_id: item.product_id,
              quantity_grams: item.quantity_grams,
              quantity_portions: item.quantity_portions
            })),
            notes: meal.notes
          };

          await this.createMeal(userId, newMealData);
        }
      }

      return true;
    } catch (error) {
      console.error('Error duplicating yesterday meals:', error);
      return false;
    }
  }

  /**
   * Update daily summary in the database
   */
  private async updateDailySummary(userId: string, date: string): Promise<void> {
    try {
      // Call the database function to calculate daily summary
      const { error } = await supabase.rpc('calculate_daily_summary', {
        user_uuid: userId,
        target_date: date
      });

      if (error) {
        console.error('Error updating daily summary:', error);
      }
    } catch (error) {
      console.error('Error calling calculate_daily_summary:', error);
    }
  }

  /**
   * Get meal suggestions based on missing nutrients
   */
  async getMealSuggestions(
    userId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  ): Promise<{ message: string; suggestions: any[] }> {
    try {
      const dailySummary = await this.getDailyNutritionSummary(userId, date);
      const userService = new (await import('./UserService')).UserService();
      const dailyTarget = await userService.calculateDailyNutritionTarget(userId);

      if (!dailyTarget) {
        return { message: 'Nie można obliczyć celów żywieniowych', suggestions: [] };
      }

      const remaining = {
        calories: dailyTarget.calories - dailySummary.calories,
        protein: dailyTarget.protein - dailySummary.protein,
        fat: dailyTarget.fat - dailySummary.fat,
        carbs: dailyTarget.carbs - dailySummary.carbs
      };

      let message = '';
      let suggestions: any[] = [];

      if (remaining.protein < 20) {
        message = 'Brakuje białka - dodaj: twaróg, kurczak, jogurt';
        suggestions = await this.productService.getNutritionSuggestions('protein', 3);
      } else if (remaining.carbs < 30) {
        message = 'Mało węglowodanów przed treningiem - dodaj: banan, ryż, owsianka';
        suggestions = await this.productService.getNutritionSuggestions('carbs', 3);
      } else if (remaining.fat < 10) {
        message = 'Brakuje tłuszczów - dodaj: orzechy, oliwa, awokado';
        suggestions = await this.productService.getNutritionSuggestions('fat', 3);
      } else {
        message = 'Dzienna dieta wygląda dobrze!';
        suggestions = await this.productService.getProductsForMealType(mealType);
      }

      return { message, suggestions };
    } catch (error) {
      console.error('Error getting meal suggestions:', error);
      return { message: 'Błąd podczas generowania sugestii', suggestions: [] };
    }
  }

  /**
   * Save LLM meal analysis to database
   */
  async saveMealAnalysis(data: {
    userId: string;
    input: string;
    analysis: any;
    date: string;
    createdAt: Date;
  }): Promise<any> {
    try {
      const { data: savedAnalysis, error } = await supabase
        .from('meal_analyses')
        .insert({
          user_id: data.userId,
          input_text: data.input,
          analysis_result: data.analysis,
          meal_date: data.date,
          created_at: data.createdAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return savedAnalysis;
    } catch (error) {
      console.error('Error saving meal analysis:', error);
      throw error;
    }
  }

  /**
   * Save meal from analysis to daily meals
   */
  async saveMealFromAnalysis(data: {
    userId: string;
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    input_text: string;
    date: string;
  }): Promise<any> {
    try {
      // Get the next order number for this date
      const { data: existingMeals, error: orderError } = await supabase
        .from('daily_meals')
        .select('meal_order')
        .eq('user_id', data.userId)
        .eq('meal_date', data.date)
        .order('meal_order', { ascending: false })
        .limit(1);

      if (orderError) throw orderError;

      const nextOrder = existingMeals && existingMeals.length > 0 
        ? existingMeals[0].meal_order + 1 
        : 1;

      // Save the meal
      const { data: savedMeal, error } = await supabase
        .from('daily_meals')
        .insert({
          user_id: data.userId,
          name: data.name,
          meal_type: data.mealType,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          input_text: data.input_text,
          meal_date: data.date,
          meal_order: nextOrder,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return savedMeal;
    } catch (error) {
      console.error('Error saving meal from analysis:', error);
      throw error;
    }
  }

  /**
   * Get daily meals with totals for a specific date
   */
  async getDailyMealsWithTotals(userId: string, date: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_daily_meals_with_totals', {
          user_uuid: userId,
          target_date: date
        });

      if (error) throw error;

      if (data && data.length > 0) {
        return data[0];
      } else {
        // Return empty structure if no meals found
        return {
          date,
          meals: [],
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fat: 0
        };
      }
    } catch (error) {
      console.error('Error getting daily meals with totals:', error);
      throw error;
    }
  }

  /**
   * Get user's current usage limits
   */
  async getUserLimits(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('get_ai_analysis_usage', { p_user_id: userId });

      if (error) throw error;

      return {
        aiAnalysis: {
          currentUsage: data[0]?.usage_count || 0,
          dailyLimit: data[0]?.daily_limit || 10
        }
      };
    } catch (error) {
      console.error('Error getting user limits:', error);
      return {
        aiAnalysis: {
          currentUsage: 0,
          dailyLimit: 10
        }
      };
    }
  }

  /**
   * Check if user can perform AI analysis (with limit)
   */
  async checkAnalysisLimit(userId: string): Promise<{
    allowed: boolean;
    currentUsage: number;
    dailyLimit: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('check_ai_analysis_limit', { 
          p_user_id: userId, 
          p_daily_limit: 10 
        });

      if (error) throw error;

      // Get current usage for response
      const limits = await this.getUserLimits(userId);
      const currentUsage = limits.aiAnalysis.currentUsage;

      return {
        allowed: data,
        currentUsage: currentUsage,
        dailyLimit: 10
      };
    } catch (error) {
      console.error('Error checking analysis limit:', error);
      // Fallback - allow if error
      return {
        allowed: true,
        currentUsage: 0,
        dailyLimit: 10
      };
    }
  }

  /**
   * Analyze meal using AI (OpenRouter)
   */
  async analyzeMealWithAI(mealDescription: string, userRegion: string = 'PL'): Promise<any> {
    try {
      console.log('🔍 AI Analysis Request:', {
        mealDescription,
        timestamp: new Date().toISOString(),
      });

      const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
      const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

      if (!OPENROUTER_API_KEY) {
        throw new Error('Brak klucza API OpenRouter w zmiennych środowiskowych');
      }

      const prompt = this.getAIPrompt(mealDescription, userRegion);
      
      const requestBody = {
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Jesteś ekspertem ds. żywienia. Zawsze odpowiadaj w formacie JSON zgodnie z instrukcjami.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      };

      console.log('🤖 OpenRouter Request:', {
        prompt,
        timestamp: new Date().toISOString()
      });

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'Cut Sprint Nutrition Assistant'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ OpenRouter API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Błąd API OpenRouter: ${response.status} ${response.statusText}`);
      }

      const openRouterResponse = await response.json();
      const llmResponse = openRouterResponse.choices[0]?.message?.content;

      console.log('🤖 OpenRouter Raw Response:', {
        response: openRouterResponse,
        llmResponse,
        timestamp: new Date().toISOString()
      });

      if (!llmResponse) {
        throw new Error('Brak odpowiedzi od LLM');
      }

      // Próba parsowania JSON z odpowiedzi LLM
      let parsedResponse;
      try {
        // Usuń ewentualne markdown formatting
        const cleanResponse = llmResponse.replace(/```json\n?|\n?```/g, '').trim();
        parsedResponse = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', {
          llmResponse,
          error: parseError
        });
        
        // Fallback - spróbuj wyciągnąć JSON z tekstu
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (fallbackError) {
            console.error('❌ Fallback JSON Parse Error:', fallbackError);
            throw new Error('Nie udało się sparsować odpowiedzi LLM');
          }
        } else {
          throw new Error('Nie znaleziono odpowiedzi JSON w odpowiedzi LLM');
        }
      }

      console.log('✅ Parsed AI Response:', {
        parsedResponse,
        timestamp: new Date().toISOString()
      });

      return parsedResponse;

    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
      
      // Fallback do symulacji w przypadku błędu
      console.log('🔄 Falling back to simulation...');
      return this.simulateAIResponse(mealDescription);
    }
  }

  private getAIPrompt(mealDescription: string, userRegion: string = 'PL'): string {
    const config = assistantConfig.nutritionAssistant;
    
    return `
${config.context}

JĘZYK/REGION UŻYTKOWNIKA: ${userRegion}
Używaj standardowych porcji dla języka/regionu ${userRegion}.

INSTRUKCJE:
${config.instructions.map(instruction => `- ${instruction}`).join('\n')}

LOGIKA POSIŁKÓW:
- Określ typ posiłku na podstawie godziny (jeśli nie podano):
  * < 12:00 = breakfast (Śniadanie)
  * 12:00-16:00 = lunch (Obiad) 
  * 16:00-20:00 = dinner (Kolacja)
  * > 20:00 = snack (Przekąska)
- Jeśli opis zawiera kilka posiłków, podziel je odpowiednio
- Każdy posiłek powinien mieć nazwę w języku polsku

FORMAT ODPOWIEDZI:
- Jeśli masz wystarczające informacje, zwróć JSON z analizą:
{
  "type": "nutrition_analysis",
  "data": {
    "totalCalories": number,
    "totalProtein": number,
    "totalCarbs": number,
    "totalFat": number,
    "meals": [
      {
        "name": "string (nazwa posiłku po polsku)",
        "mealType": "breakfast|lunch|dinner|snack",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number
      }
    ],
    "confidence": "high|medium|low",
    "notes": "string"
  }
}

- Jeśli brakuje informacji, zwróć JSON z pytaniem:
{
  "type": "clarification_needed",
  "question": "string",
  "suggestions": ["string"]
}

OPIS POSIŁKU DO ANALIZY:
"${mealDescription}"

ODPOWIEDŹ (tylko JSON):
`;
  }

  private simulateAIResponse(mealDescription: string): any {
    // Symulacja jako fallback
    const lowerDescription = mealDescription.toLowerCase();
    
    if (lowerDescription.includes('g') || lowerDescription.includes('gram') || 
        lowerDescription.includes('szt') || lowerDescription.includes('kawałek') ||
        lowerDescription.includes('łyżka') || lowerDescription.includes('szklanka')) {
      
      const calories = this.calculateCalories(lowerDescription);
      const protein = this.calculateProtein(lowerDescription);
      const carbs = this.calculateCarbs(lowerDescription);
      const fat = this.calculateFat(lowerDescription);
      
      // Określ typ posiłku na podstawie godziny
      const hour = new Date().getHours();
      let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
      let mealName: string;
      
      if (hour < 12) {
        mealType = 'breakfast';
        mealName = 'Śniadanie';
      } else if (hour < 16) {
        mealType = 'lunch';
        mealName = 'Obiad';
      } else if (hour < 20) {
        mealType = 'dinner';
        mealName = 'Kolacja';
      } else {
        mealType = 'snack';
        mealName = 'Przekąska';
      }
      
      return {
        type: 'nutrition_analysis',
        data: {
          totalCalories: calories,
          totalProtein: protein,
          totalCarbs: carbs,
          totalFat: fat,
          meals: [{
            name: mealName,
            mealType,
            calories,
            protein,
            carbs,
            fat
          }],
          confidence: 'medium',
          notes: 'Analiza oparta na podanych ilościach (tryb fallback)'
        }
      };
    } else {
      return {
        type: 'clarification_needed',
        question: 'Potrzebuję więcej informacji o ilości. Ile dokładnie zjadłeś/aś?',
        suggestions: [
          'Podaj wagę w gramach (np. 200g)',
          'Podaj ilość sztuk (np. 2 jajka)',
          'Podaj objętość (np. 1 szklanka)',
          'Opisz wielkość porcji (np. średni banan)'
        ]
      };
    }
  }

  private calculateCalories(description: string): number {
    let calories = 0;
    
    if (description.includes('kurczak') || description.includes('pierś')) {
      calories += 165; // per 100g
    }
    if (description.includes('ryż')) {
      calories += 130; // per 100g
    }
    if (description.includes('jajko') || description.includes('jajka')) {
      calories += 155; // per piece
    }
    if (description.includes('chleb') || description.includes('kanapka')) {
      calories += 265; // per 100g
    }
    if (description.includes('mleko')) {
      calories += 61; // per 100ml
    }
    if (description.includes('banan')) {
      calories += 89; // per piece
    }
    if (description.includes('jabłko')) {
      calories += 52; // per piece
    }
    if (description.includes('brokuł')) {
      calories += 34; // per 100g
    }
    
    return calories || Math.floor(Math.random() * 300) + 200;
  }

  private calculateProtein(description: string): number {
    let protein = 0;
    
    if (description.includes('kurczak') || description.includes('pierś')) {
      protein += 31; // per 100g
    }
    if (description.includes('ryż')) {
      protein += 2.7; // per 100g
    }
    if (description.includes('jajko') || description.includes('jajka')) {
      protein += 13; // per piece
    }
    if (description.includes('chleb') || description.includes('kanapka')) {
      protein += 9; // per 100g
    }
    if (description.includes('mleko')) {
      protein += 3.2; // per 100ml
    }
    if (description.includes('banan')) {
      protein += 1.1; // per piece
    }
    if (description.includes('jabłko')) {
      protein += 0.3; // per piece
    }
    if (description.includes('brokuł')) {
      protein += 2.8; // per 100g
    }
    
    return protein || Math.floor(Math.random() * 20) + 10;
  }

  private calculateCarbs(description: string): number {
    let carbs = 0;
    
    if (description.includes('kurczak') || description.includes('pierś')) {
      carbs += 0; // per 100g
    }
    if (description.includes('ryż')) {
      carbs += 28; // per 100g
    }
    if (description.includes('jajko') || description.includes('jajka')) {
      carbs += 1.1; // per piece
    }
    if (description.includes('chleb') || description.includes('kanapka')) {
      carbs += 49; // per 100g
    }
    if (description.includes('mleko')) {
      carbs += 4.8; // per 100ml
    }
    if (description.includes('banan')) {
      carbs += 23; // per piece
    }
    if (description.includes('jabłko')) {
      carbs += 14; // per piece
    }
    if (description.includes('brokuł')) {
      carbs += 7; // per 100g
    }
    
    return carbs || Math.floor(Math.random() * 30) + 20;
  }

  private calculateFat(description: string): number {
    let fat = 0;
    
    if (description.includes('kurczak') || description.includes('pierś')) {
      fat += 3.6; // per 100g
    }
    if (description.includes('ryż')) {
      fat += 0.3; // per 100g
    }
    if (description.includes('jajko') || description.includes('jajka')) {
      fat += 11; // per piece
    }
    if (description.includes('chleb') || description.includes('kanapka')) {
      fat += 3.2; // per 100g
    }
    if (description.includes('mleko')) {
      fat += 3.3; // per 100ml
    }
    if (description.includes('banan')) {
      fat += 0.3; // per piece
    }
    if (description.includes('jabłko')) {
      fat += 0.2; // per piece
    }
    if (description.includes('brokuł')) {
      fat += 0.4; // per 100g
    }
    
    return fat || Math.floor(Math.random() * 10) + 5;
  }
}
