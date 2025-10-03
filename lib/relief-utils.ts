import { supabase } from './supabase-client';

/**
 * Auto-complete relief pins that have passed their end_datetime
 * This function should be called periodically or on app load
 */
export async function autoCompleteReliefPins(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Find pins that should be completed (end_datetime has passed and status is approved)
    const { data: pinsToComplete, error } = await supabase
      .from('relief_pins')
      .select('id')
      .eq('status', 'approved')
      .lt('end_datetime', now)
      .not('end_datetime', 'is', null);

    if (error) {
      console.error('Error finding pins to complete:', error);
      return;
    }

    if (pinsToComplete && pinsToComplete.length > 0) {
      // Update all pins to completed status
      const { error: updateError } = await supabase
        .from('relief_pins')
        .update({ status: 'completed' })
        .in('id', pinsToComplete.map(pin => pin.id));

      if (updateError) {
        console.error('Error updating pins to completed:', updateError);
      } else {
        console.log(`Auto-completed ${pinsToComplete.length} relief pins`);
      }
    }
  } catch (error) {
    console.error('Error in autoCompleteReliefPins:', error);
  }
}

/**
 * Get active relief pins (not completed)
 */
export async function getActiveReliefPins(userId?: string, isAdmin: boolean = false) {
  let query = supabase
    .from('relief_pins')
    .select('*, user_profile:user_profiles(*)')
    .eq('is_active', true)
    .neq('status', 'completed') // Exclude completed pins
    .order('created_at', { ascending: false });

  if (!isAdmin && userId) {
    query = query.or(`status.eq.approved,user_id.eq.${userId}`);
  }

  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data || [];
}

/**
 * Get all relief pins including completed ones (for admin)
 */
export async function getAllReliefPins(userId?: string, isAdmin: boolean = false) {
  let query = supabase
    .from('relief_pins')
    .select('*, user_profile:user_profiles(*)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (!isAdmin && userId) {
    query = query.or(`status.eq.approved,user_id.eq.${userId}`);
  }

  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data || [];
}
