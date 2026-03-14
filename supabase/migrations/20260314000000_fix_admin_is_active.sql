-- Fix: Set is_active = true for admin users where it is NULL or false.
-- This ensures admin users can see the Admin entry in MobileBottomNav.
-- Issue: #86 (QA FAIL — fd_user_roles.is_active was NULL for admin user ajrrac@gmail.com)
UPDATE fd_user_roles
SET is_active = true
WHERE role = 'admin'
  AND (is_active IS NULL OR is_active = false);
