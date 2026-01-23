
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fuhgurkmsyowpidxinqa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1aGd1cmttc3lvd3BpZHhpbnFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NzI4OTgsImV4cCI6MjA4NDM0ODg5OH0.G50ncmKDGlEFrgD4IslKXDJX2vjvC6RJo6IjFlGrA2I';

async function listProfiles() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profiles:', JSON.stringify(data, null, 2));
    }
}

listProfiles();
