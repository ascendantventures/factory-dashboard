-- ============================================================
-- fd_issue_templates (Issue #27 — Templates & Quick Create)
-- ============================================================
CREATE TABLE IF NOT EXISTS fd_issue_templates (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL,
  description   TEXT        NOT NULL DEFAULT '',
  title_prefix  TEXT        NOT NULL DEFAULT '',
  body_template TEXT        NOT NULL,
  labels        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  estimated_cost TEXT       NOT NULL DEFAULT '',
  complexity    TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (complexity IN ('simple', 'medium', 'complex')),
  is_default    BOOLEAN     NOT NULL DEFAULT false,
  created_by    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fd_issue_templates_is_default
  ON fd_issue_templates (is_default);

CREATE INDEX IF NOT EXISTS idx_fd_issue_templates_created_by
  ON fd_issue_templates (created_by);

-- updated_at trigger (SECURITY DEFINER pattern)
CREATE OR REPLACE FUNCTION fd_set_issue_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fd_issue_templates_updated_at ON fd_issue_templates;
CREATE TRIGGER trg_fd_issue_templates_updated_at
  BEFORE UPDATE ON fd_issue_templates
  FOR EACH ROW
  EXECUTE FUNCTION fd_set_issue_templates_updated_at();

-- RLS
ALTER TABLE fd_issue_templates ENABLE ROW LEVEL SECURITY;

-- Authenticated users: read all templates
CREATE POLICY "fd_issue_templates_select_authenticated"
  ON fd_issue_templates FOR SELECT
  TO authenticated
  USING (true);

-- Admin only: insert (checks dash_user_roles table consistent with existing pattern)
CREATE POLICY "fd_issue_templates_insert_admin"
  ON fd_issue_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin only: update
CREATE POLICY "fd_issue_templates_update_admin"
  ON fd_issue_templates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin only: delete
CREATE POLICY "fd_issue_templates_delete_admin"
  ON fd_issue_templates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM dash_user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- Seed: 6 default templates (ON CONFLICT DO NOTHING — idempotent)
-- ============================================================
INSERT INTO fd_issue_templates (name, description, title_prefix, body_template, labels, estimated_cost, complexity, is_default)
VALUES
  (
    'SaaS Application',
    'Full-stack SaaS with auth, billing, and dashboard',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- User authentication (email + social)\n- Dashboard with analytics\n- Billing integration (Stripe)\n- User settings & profile\n\n## Acceptance Criteria\n- [ ] Auth flow (signup, login, password reset)\n- [ ] Dashboard with key metrics\n- [ ] Stripe checkout + subscription management\n- [ ] Responsive UI',
    '["complexity:complex"]',
    '~15-25 credits',
    'complex',
    true
  ),
  (
    'Landing Page',
    'Marketing landing page with CMS-driven content',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- Hero section with CTA\n- Features / benefits section\n- Pricing table\n- Contact / waitlist form\n\n## Acceptance Criteria\n- [ ] Fully responsive\n- [ ] Form submissions stored in DB\n- [ ] SEO meta tags\n- [ ] Page load < 2s',
    '["complexity:simple"]',
    '~3-5 credits',
    'simple',
    true
  ),
  (
    'API Service',
    'REST or GraphQL API with auth and rate limiting',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- JWT authentication\n- Rate limiting middleware\n- OpenAPI / Swagger docs\n- Health check endpoint\n\n## Acceptance Criteria\n- [ ] All endpoints return correct status codes\n- [ ] Auth required on protected routes\n- [ ] Docs auto-generated',
    '["complexity:medium"]',
    '~5-10 credits',
    'medium',
    true
  ),
  (
    'Internal Dashboard',
    'Admin dashboard with tables, filters, and CRUD',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- Data tables with sort/filter/pagination\n- CRUD modals\n- Role-based access (admin / viewer)\n- Export to CSV\n\n## Acceptance Criteria\n- [ ] All tables paginated (50 rows max)\n- [ ] Admin can create/edit/delete\n- [ ] Viewer role is read-only\n- [ ] CSV export works',
    '["complexity:medium"]',
    '~5-15 credits',
    'medium',
    true
  ),
  (
    'E-commerce Store',
    'Product catalog, cart, and Stripe Checkout',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- Product listing + detail pages\n- Cart with quantity management\n- Stripe Checkout session\n- Order confirmation email\n\n## Acceptance Criteria\n- [ ] Products load from DB\n- [ ] Cart persists on refresh\n- [ ] Stripe test mode checkout works\n- [ ] Order saved on payment success',
    '["complexity:complex"]',
    '~15-25 credits',
    'complex',
    true
  ),
  (
    'Portfolio / Showcase',
    'Personal or agency portfolio with project gallery',
    '',
    E'## Overview\n{{description}}\n\n## Requirements\n- Project gallery with filtering by tag\n- About / bio section\n- Contact form\n- Dark/light mode\n\n## Acceptance Criteria\n- [ ] Projects filterable by tag\n- [ ] Contact form submits to DB\n- [ ] Lighthouse score > 90\n- [ ] Dark mode toggle works',
    '["complexity:simple"]',
    '~3-5 credits',
    'simple',
    true
  )
ON CONFLICT DO NOTHING;
