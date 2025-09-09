-- Add geolocation fields to audits
ALTER TABLE audits
  ADD COLUMN start_latitude numeric(10,8),
  ADD COLUMN start_longitude numeric(11,8),
  ADD COLUMN end_latitude numeric(10,8),
  ADD COLUMN end_longitude numeric(11,8);

