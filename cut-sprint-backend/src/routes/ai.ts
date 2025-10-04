import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../lib/supabase';
import { AuthenticatedRequest } from "../middleware/auth";
import { createError } from '../middleware/errorHandler';

const router = Router();

// Generate AI plan for sprint
router.post('/generate-plan', [
  body('sprint_id').isUUID(),
  body('prompt').isLength({ min: 10, max: 2000 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { sprint_id, prompt } = req.body;

    // Verify sprint belongs to user
    const { data: sprint, error: sprintError } = await supabase
      .from('week_sprints')
      .select('*')
      .eq('id', sprint_id)
      .eq('user_id', req.user.id)
      .single();

    if (sprintError || !sprint) {
      throw createError('Sprint not found', 404);
    }

    // Get user profile for context
    const { data: userProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    // Get existing meal and workout presets
    const { data: mealPresets } = await supabase
      .from('meal_presets')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${req.user.id}`);

    const { data: workoutPresets } = await supabase
      .from('workout_presets')
      .select('*')
      .or(`is_global.eq.true,created_by.eq.${req.user.id}`);

    // Calculate daily calorie targets based on sprint duration
    const startDate = new Date(sprint.start_date);
    const endDate = new Date(sprint.end_date);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simple calorie calculation (can be enhanced)
    const dailyCalorieTargets = Array(daysDiff).fill(1800); // Default 1800 calories per day

    // Mock AI response (replace with actual AI service integration)
    const aiResponse = {
      daily_calorie_targets: dailyCalorieTargets,
      recommended_meals: mealPresets?.slice(0, 10) || [],
      recommended_workouts: workoutPresets?.slice(0, 5) || [],
      tips: [
        'Stay hydrated throughout the day',
        'Get at least 7-8 hours of sleep',
        'Include protein in every meal',
        'Take rest days between intense workouts'
      ]
    };

    // Save AI plan to database
    const { data: aiPlan, error: planError } = await supabase
      .from('ai_plans')
      .insert({
        sprint_id,
        daily_calorie_targets: aiResponse.daily_calorie_targets,
        recommended_meals: aiResponse.recommended_meals,
        recommended_workouts: aiResponse.recommended_workouts,
        tips: aiResponse.tips,
        prompt
      })
      .select()
      .single();

    if (planError) {
      throw createError('Failed to save AI plan', 500);
    }

    res.status(201).json({ plan: aiPlan });
  } catch (error) {
    next(error);
  }
});

// Get AI plan for sprint
router.get('/plan/:sprint_id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { sprint_id } = req.params;

    // Verify sprint belongs to user
    const { data: sprint } = await supabase
      .from('week_sprints')
      .select('id')
      .eq('id', sprint_id)
      .eq('user_id', req.user.id)
      .single();

    if (!sprint) {
      throw createError('Sprint not found', 404);
    }

    // Get AI plan
    const { data, error } = await supabase
      .from('ai_plans')
      .select('*')
      .eq('sprint_id', sprint_id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.json({ plan: null });
      }
      throw createError('Failed to fetch AI plan', 500);
    }

    res.json({ plan: data });
  } catch (error) {
    next(error);
  }
});

// Get all AI plans for user
router.get('/plans', [
  body('limit').optional().isInt({ min: 1, max: 50 })
], async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        details: errors.array()
      });
    }

    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { limit = 20 } = req.query;

    const { data, error } = await supabase
      .from('ai_plans')
      .select(`
        *,
        sprint:week_sprints (
          id,
          start_date,
          end_date,
          target_weight_loss,
          status
        )
      `)
      .eq('sprint.user_id', req.user.id)
      .order('generated_at', { ascending: false })
      .limit(Number(limit));

    if (error) {
      throw createError('Failed to fetch AI plans', 500);
    }

    res.json({ plans: data });
  } catch (error) {
    next(error);
  }
});

// Delete AI plan
router.delete('/plan/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!req.user) {
      throw createError('User not authenticated', 401);
    }

    const { id } = req.params;

    // Verify plan belongs to user's sprint
    const { data: plan } = await supabase
      .from('ai_plans')
      .select(`
        id,
        sprint:week_sprints!inner (
          user_id
        )
      `)
      .eq('id', id)
      .eq('sprint.user_id', req.user.id)
      .single();

    if (!plan) {
      throw createError('AI plan not found', 404);
    }

    const { error } = await supabase
      .from('ai_plans')
      .delete()
      .eq('id', id);

    if (error) {
      throw createError('Failed to delete AI plan', 500);
    }

    res.json({ message: 'AI plan deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
