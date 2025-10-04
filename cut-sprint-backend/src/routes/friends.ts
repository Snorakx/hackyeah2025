import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthenticatedRequest } from "../middleware/auth";
import { supabase } from '../lib/supabase';

const router = express.Router();

/**
 * @route POST /api/friends/request
 * @desc Send friend request
 * @access Private
 */
router.post('/request', [
  body('email').isEmail().normalizeEmail()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { email } = req.body;

    const { data, error } = await supabase.rpc('send_friend_request', {
      p_user_id: userId,
      p_friend_email: email
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: { request_id: data },
      message: 'Friend request sent successfully'
    });
  } catch (error: any) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route POST /api/friends/accept
 * @desc Accept friend request
 * @access Private
 */
router.post('/accept', [
  body('friend_id').isUUID()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid friend ID'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { friend_id } = req.body;

    const { error } = await supabase.rpc('accept_friend_request', {
      p_user_id: userId,
      p_friend_id: friend_id
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error: any) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route GET /api/friends
 * @desc Get user's friends
 * @access Private
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { data, error } = await supabase.rpc('get_friends', {
      p_user_id: userId
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Error getting friends:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route GET /api/friends/requests
 * @desc Get pending friend requests
 * @access Private
 */
router.get('/requests', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { data, error } = await supabase.rpc('get_pending_friend_requests', {
      p_user_id: userId
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Error getting friend requests:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route GET /api/friends/progress
 * @desc Get friends' progress for today
 * @access Private
 */
router.get('/progress', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase.rpc('get_friends_progress', {
      p_user_id: userId,
      p_date: date
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Error getting friends progress:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route GET /api/friends/leaderboard
 * @desc Get leaderboard
 * @access Private
 */
router.get('/leaderboard', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const days = parseInt(req.query.days as string) || 7;

    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_user_id: userId,
      p_days: days
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

/**
 * @route POST /api/friends/update-goal
 * @desc Update daily goal completion
 * @access Private
 */
router.post('/update-goal', [
  body('calories_goal').isInt({ min: 0 }),
  body('protein_goal').isFloat({ min: 0 }),
  body('calories_actual').isInt({ min: 0 }),
  body('protein_actual').isFloat({ min: 0 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input data'
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { calories_goal, protein_goal, calories_actual, protein_actual } = req.body;

    const { data, error } = await supabase.rpc('update_daily_goal', {
      p_user_id: userId,
      p_calories_goal: calories_goal,
      p_protein_goal: protein_goal,
      p_calories_actual: calories_actual,
      p_protein_actual: protein_actual
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      data: data,
      message: 'Daily goal updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating daily goal:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Internal server error'
    });
  }
});

export default router;
