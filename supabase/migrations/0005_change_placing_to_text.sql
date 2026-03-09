ALTER TABLE user_tournaments
ALTER COLUMN placing TYPE TEXT USING placing::TEXT;
