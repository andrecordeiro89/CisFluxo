-- Insert 10 specialist consultation rooms (Consultórios de Especialistas)
INSERT INTO public.stations (step, station_number, name, is_active)
SELECT 'especialista', generate_series, 'Consultório ' || generate_series, true
FROM generate_series(1, 10)
ON CONFLICT DO NOTHING;