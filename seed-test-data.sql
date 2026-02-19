-- ============================================
-- M3 Style — Seed Data for Testing
-- Run this AFTER schema.sql
-- ============================================

-- 1. Create a designer user account (if not exists)
INSERT INTO users (email, password_hash, name, auth_provider, is_designer, email_verified)
VALUES ('designer@maison-elysee.com', '$2b$10$placeholder_hash_not_for_login', 'Marc-Antoine Dubois', 'email', true, true)
ON CONFLICT (email) DO NOTHING;

-- 2. Create the designer profile
INSERT INTO designers (user_id, brand_name, slug, description, description_fr, city, province, country, specialties, style_tags, price_range, status, featured, verified)
SELECT id, 
  'Maison Élysée',
  'maison-elysee',
  'Montreal-born menswear brand blending European craftsmanship with urban sensibility. Founded in 2019 by Marc-Antoine Dubois.',
  'Marque montréalaise de mode masculine alliant savoir-faire européen et sensibilité urbaine. Fondée en 2019 par Marc-Antoine Dubois.',
  'Montréal', 'Québec', 'Canada',
  ARRAY['chemises', 'blazers', 'pantalons', 'accessoires'],
  ARRAY['casual chic', 'smart casual', 'urbain', 'moderne'],
  '$$-$$$',
  'active', true, true
FROM users WHERE email = 'designer@maison-elysee.com'
ON CONFLICT DO NOTHING;

-- 3. Create a collection
INSERT INTO collections (designer_id, name, name_fr, description_fr, season, year, status, published_at)
SELECT d.id,
  'Printemps Urbain 2026',
  'Printemps Urbain 2026',
  'Collection inspirée par les rues de Montréal au printemps. Des pièces polyvalentes qui passent du bureau au 5 à 7.',
  'spring', 2026, 'published', CURRENT_TIMESTAMP
FROM designers d WHERE d.slug = 'maison-elysee'
ON CONFLICT DO NOTHING;

-- 4. Products catalog — Maison Élysée
-- Using placeholder image URLs (replace with real product photos later)

-- TOPS
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, color_secondary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, featured, in_stock)
SELECT d.id, c.id,
  'Chemise Oxford Classique', 'Chemise Oxford Classique',
  'Chemise en coton Oxford premium. Col boutonné, coupe ajustée moderne. Le classique réinventé avec des détails subtils: coutures contrastantes et boutons en nacre.',
  'tops', 'chemise', 125.00, 'CAD', 'Blanc', NULL, NULL, 'Coton Oxford 100%', 'regular',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['spring', 'summer', 'fall'], ARRAY['bureau', 'soiree', 'casual'],
  ARRAY['classique', 'smart casual', 'polyvalent'],
  ARRAY['https://placehold.co/600x800/1a1a2e/8b5cf6?text=Oxford+Blanc'],
  'active', true, true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, color_secondary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Chemise Chambray Délavée', 'Chemise Chambray Délavée',
  'Chambray japonais léger avec un délavé naturel. Parfaite pour un look casual sophistiqué. Col italien et poignets roulables.',
  'tops', 'chemise', 145.00, 'CAD', 'Bleu indigo', NULL, NULL, 'Chambray japonais', 'regular',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['spring', 'summer'], ARRAY['casual', 'weekend', 'brunch'],
  ARRAY['casual chic', 'décontracté', 'weekend'],
  ARRAY['https://placehold.co/600x800/1a1a2e/60a5fa?text=Chambray+Bleu'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Polo Mérinos Luxe', 'Polo Mérinos Luxe',
  'Polo en laine mérinos extra-fine. Douceur incomparable, régulation thermique naturelle. Col côtelé et finitions premium.',
  'tops', 'polo', 165.00, 'CAD', 'Marine', NULL, 'Laine mérinos extra-fine', 'slim',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['spring', 'fall'], ARRAY['bureau', 'soiree', 'restaurant'],
  ARRAY['élégant', 'smart casual', 'luxe'],
  ARRAY['https://placehold.co/600x800/1a1a2e/6366f1?text=Polo+Marine'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'T-Shirt Pima Essentiel', 'T-Shirt Pima Essentiel',
  'Coton Pima péruvien, le plus doux au monde. Coupe moderne ni trop serrée ni trop ample. Un essentiel qui élève tout look casual.',
  'tops', 't-shirt', 75.00, 'CAD', 'Noir', NULL, 'Coton Pima 100%', 'regular',
  ARRAY['S', 'M', 'L', 'XL', 'XXL'],
  ARRAY['spring', 'summer', 'fall', 'winter'], ARRAY['casual', 'weekend', 'quotidien'],
  ARRAY['essentiel', 'basique premium', 'casual'],
  ARRAY['https://placehold.co/600x800/1a1a2e/94a3b8?text=Tshirt+Noir'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

-- SUITS / BLAZERS
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, featured, in_stock)
SELECT d.id, c.id,
  'Blazer Lin Déstructuré', 'Blazer Lin Déstructuré',
  'Blazer non doublé en lin italien. Épaules naturelles, construction déstructurée pour un tombé décontracté mais élégant. La pièce signature de la collection.',
  'suits', 'blazer', 385.00, 'CAD', 'Gris clair', NULL, 'Lin italien', 'regular',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['spring', 'summer'], ARRAY['soiree', 'mariage', 'bureau', 'restaurant'],
  ARRAY['élégant', 'casual chic', 'été', 'signature'],
  ARRAY['https://placehold.co/600x800/1a1a2e/a78bfa?text=Blazer+Lin+Gris'],
  'active', true, true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Veston Stretch Marine', 'Veston Stretch Marine',
  'Veston en laine stretch avec 2% élasthanne pour un confort de mouvement exceptionnel. Doublure fleurie signature Maison Élysée.',
  'suits', 'veston', 425.00, 'CAD', 'Marine', NULL, 'Laine stretch', 'slim',
  ARRAY['36', '38', '40', '42', '44'],
  ARRAY['fall', 'winter', 'spring'], ARRAY['bureau', 'soiree', 'formel'],
  ARRAY['classique', 'professionnel', 'polyvalent'],
  ARRAY['https://placehold.co/600x800/1a1a2e/818cf8?text=Veston+Marine'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

-- BOTTOMS
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Chino Stretch Confort', 'Chino Stretch Confort',
  'Chino en twill de coton stretch. Taille confortable, jambe fuselée moderne. Poche à montre et coutures renforcées.',
  'bottoms', 'chino', 155.00, 'CAD', 'Beige sable', NULL, 'Coton stretch twill', 'regular',
  ARRAY['28', '30', '32', '34', '36', '38'],
  ARRAY['spring', 'summer', 'fall'], ARRAY['bureau', 'casual', 'weekend'],
  ARRAY['polyvalent', 'casual chic', 'confort'],
  ARRAY['https://placehold.co/600x800/1a1a2e/d4a574?text=Chino+Beige'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Pantalon Ville Charbon', 'Pantalon Ville Charbon',
  'Pantalon habillé en laine tropicale légère. Plis permanents, finition impeccable. Du bureau au restaurant sans compromis.',
  'bottoms', 'pantalon', 195.00, 'CAD', 'Charbon', NULL, 'Laine tropicale', 'slim',
  ARRAY['28', '30', '32', '34', '36'],
  ARRAY['spring', 'summer', 'fall', 'winter'], ARRAY['bureau', 'formel', 'soiree', 'restaurant'],
  ARRAY['professionnel', 'élégant', 'classique'],
  ARRAY['https://placehold.co/600x800/1a1a2e/64748b?text=Pantalon+Charbon'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

-- OUTERWEAR
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Blouson Bomber Technique', 'Blouson Bomber Technique',
  'Bomber moderne en tissu technique imperméable. Doublure matelassée légère, poches zippées YKK. La version urbaine du classique aviateur.',
  'outerwear', 'bomber', 345.00, 'CAD', 'Noir', NULL, 'Nylon technique', 'regular',
  ARRAY['S', 'M', 'L', 'XL'],
  ARRAY['spring', 'fall'], ARRAY['casual', 'weekend', 'soiree'],
  ARRAY['urbain', 'moderne', 'streetwear élevé'],
  ARRAY['https://placehold.co/600x800/1a1a2e/475569?text=Bomber+Noir'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

-- SHOES
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, featured, in_stock)
SELECT d.id, c.id,
  'Derby Cuir Cognac', 'Derby Cuir Cognac',
  'Derby en cuir de veau pleine fleur, tannage végétal italien. Semelle Blake cousue main. Patine cognac qui vieillit magnifiquement.',
  'shoes', 'derby', 295.00, 'CAD', 'Cognac', NULL, 'Cuir de veau pleine fleur', 'regular',
  ARRAY['8', '9', '10', '11', '12'],
  ARRAY['spring', 'summer', 'fall', 'winter'], ARRAY['bureau', 'soiree', 'mariage', 'restaurant'],
  ARRAY['classique', 'élégant', 'intemporel'],
  ARRAY['https://placehold.co/600x800/1a1a2e/b87333?text=Derby+Cognac'],
  'active', true, true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Sneaker Cuir Minimaliste', 'Sneaker Cuir Minimaliste',
  'Sneaker basse en cuir nappa blanc. Design épuré sans logo visible. Semelle Margom italienne. Le sneaker qui va avec tout.',
  'shoes', 'sneaker', 225.00, 'CAD', 'Blanc', NULL, 'Cuir nappa', 'regular',
  ARRAY['8', '9', '10', '11', '12'],
  ARRAY['spring', 'summer', 'fall'], ARRAY['casual', 'weekend', 'quotidien'],
  ARRAY['minimaliste', 'moderne', 'polyvalent'],
  ARRAY['https://placehold.co/600x800/1a1a2e/e2e8f0?text=Sneaker+Blanc'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

-- ACCESSORIES
INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Ceinture Réversible', 'Ceinture Réversible',
  'Ceinture en cuir italien réversible: noir d''un côté, brun de l''autre. Boucle pivotante en laiton brossé. Deux ceintures en une.',
  'accessories', 'ceinture', 95.00, 'CAD', 'Noir/Brun', NULL, 'Cuir italien', 'regular',
  ARRAY['30', '32', '34', '36', '38'],
  ARRAY['spring', 'summer', 'fall', 'winter'], ARRAY['bureau', 'casual', 'soiree', 'quotidien'],
  ARRAY['essentiel', 'polyvalent', 'classique'],
  ARRAY['https://placehold.co/600x800/1a1a2e/78716c?text=Ceinture'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;

INSERT INTO products (designer_id, collection_id, name, name_fr, description_fr, category, subcategory, price, currency, color_primary, pattern, material, fit, available_sizes, season, occasion, style_tags, images, status, in_stock)
SELECT d.id, c.id,
  'Pochette de Soie Florale', 'Pochette de Soie Florale',
  'Pochette de costume en soie italienne imprimée à la main. Motif floral exclusif Maison Élysée. La touche finale qui fait toute la différence.',
  'accessories', 'pochette', 65.00, 'CAD', 'Bleu/Floral', 'floral', 'Soie italienne', NULL,
  ARRAY['Unique'],
  ARRAY['spring', 'summer', 'fall', 'winter'], ARRAY['soiree', 'mariage', 'formel'],
  ARRAY['élégant', 'signature', 'détail'],
  ARRAY['https://placehold.co/600x800/1a1a2e/6366f1?text=Pochette+Florale'],
  'active', true
FROM designers d JOIN collections c ON c.designer_id = d.id WHERE d.slug = 'maison-elysee' LIMIT 1;


-- ============================================
-- 5. TEST WARDROBE for Sylvain's account
-- (Assumes user email = sylgauthier@gmail.com)
-- ============================================

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Jean Levi''s 501 foncé', 'bottoms', 'jeans', 'Bleu foncé', 'Levi''s', 'Denim', 'regular', NULL, '34'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'T-shirt blanc col rond', 'tops', 't-shirt', 'Blanc', 'Uniqlo', 'Coton', 'regular', NULL, 'L'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Chemise lin blanche', 'tops', 'chemise', 'Blanc cassé', NULL, 'Lin', 'regular', NULL, 'L'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Pull col rond gris chiné', 'tops', 'pull', 'Gris chiné', 'Zara', 'Laine mélangée', 'regular', NULL, 'L'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Veste de costume rayée grise', 'suits', 'veston', 'Gris clair', NULL, 'Coton seersucker', 'regular', 'rayures', 'L'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Bottines cuir brun', 'shoes', 'bottine', 'Brun', 'Clarks', 'Cuir', 'regular', NULL, '10'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Chino beige', 'bottoms', 'chino', 'Beige', 'Dockers', 'Coton twill', 'regular', NULL, '34'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO wardrobe_items (user_id, name, category, subcategory, color_primary, brand, material, fit, pattern, size)
SELECT id, 'Ceinture cuir noir', 'accessories', 'ceinture', 'Noir', NULL, 'Cuir', NULL, NULL, '34'
FROM users WHERE email = 'sylgauthier@gmail.com'
ON CONFLICT DO NOTHING;
