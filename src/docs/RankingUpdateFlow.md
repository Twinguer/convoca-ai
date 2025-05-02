
# Ranking Update Flow Documentation

This document describes the complete flow for updating rankings in the system, explaining how score calculations are propagated to all users.

## Database Structure

### Key Tables
- `user_rankings`: Stores user rankings for each concurso
- `user_answers`: Stores user answers for each ranking
- `official_answer_weights`: Stores the official answer key with weights for each concurso
- `score_calculation_logs`: Logs all score calculation operations

### Key Database Functions
- `recalculate_all_scores_with_weights`: Main function to recalculate all scores for a concurso (with SECURITY DEFINER)
- `recalculate_all_users_scores_realtime`: Marks all rankings for a concurso for recalculation (with SECURITY DEFINER)
- `update_answer_with_weight`: Updates an answer in the official answer key (with SECURITY DEFINER)
- `save_user_answers_and_calculate_scores`: Saves user answers and calculates scores (with SECURITY DEFINER)
- `calculate_user_score_realtime`: Calculates scores for a single user (with SECURITY DEFINER)

## Update Flow Sequence

1. **Trigger Points**:
   - When official answers are updated (via `useOfficialAnswerWeights`)
   - When a user saves their answers (via `useSaveAnswers`)
   - Manual refresh (via button in `ResultadosPage`)

2. **Score Recalculation Process**:
   - Frontend calls `recalculateAllUserScores` from `batchOperations.ts`
   - This calls the database function `recalculate_all_scores_with_weights` with SECURITY DEFINER privileges
   - The database function updates all user rankings for the concurso, bypassing RLS

3. **Realtime Updates**:
   - After recalculation, `is_score_recalculated` flag is set to false via `recalculate_all_users_scores_realtime`
   - Frontend listens to database changes via Supabase channels
   - When changes are detected, rankings are refetched automatically

## Key Components and Their Roles

### Frontend Components
- `ResultadosPage`: Main page displaying rankings, includes refresh button
- `RankingTable`: Displays user rankings with scores
- `AnswerSheet`: Interface for users to input their answers

### Frontend Hooks
- `useResultadosData`: Fetches and manages ranking data
- `useOfficialAnswerWeights`: Manages official answer keys
- `useSaveAnswers`: Handles answer saving and score calculation

### Backend Operations
- `batchOperations.ts`: Contains functions for bulk operations like `recalculateAllUserScores`
- `answerKeyService.ts`: Services for answer key management
- `scoreCalculation.ts`: Functions for calculating user scores

## Detailed Update Flow

1. **Official Answer Update**: 
   - Admin updates an answer via `useOfficialAnswerWeights.updateAnswer`
   - This calls `update_answer_with_weight` database function
   - After update, `recalculateAllUserScores` is called
   - All user scores are recalculated in the database with SECURITY DEFINER privileges

2. **User Answer Save**:
   - User saves answers via `useSaveAnswers.handleSaveAnswers`
   - This calls `save_user_answers_and_calculate_scores` database function
   - After save, `recalculateAllUserScores` is called to update all users
   - Scores are recalculated with SECURITY DEFINER privileges

3. **Manual Refresh**:
   - User clicks refresh button in `ResultadosPage`
   - `refreshData` function is called
   - This calls `recalculateAllUserScores` from `batchOperations.ts`
   - All user scores are recalculated in the database

4. **Realtime Updates**:
   - `useResultadosData` hook sets up a Supabase channel listener
   - When rankings are updated, data is automatically refetched
   - Users see updates in real-time without refreshing the page

## Security and Performance

- SECURITY DEFINER is used for key database functions to bypass RLS
- This allows admins and ranking creators to update all users' scores
- Public RLS policies are set to allow anyone to read rankings
- Batch operations are used for efficiency when updating many users
- Realtime updates use efficient Supabase channels for immediate propagation

## Troubleshooting

If ranking updates aren't propagating:

1. Check that database functions have SECURITY DEFINER flag
2. Verify RLS policies allow appropriate access
3. Ensure realtime channels are correctly configured
4. Look for errors in score calculation logs
5. Test manual refresh via the refresh button in ResultadosPage
