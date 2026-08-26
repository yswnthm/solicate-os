import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'solicate' }
})

async function run() {
  const { data, error } = await supabase.from('profile').select('*')
  if (error) {
    console.error("Error:", error.message)
    console.error(error)
  } else {
    console.log("Data:", data)
  }
}

run()
