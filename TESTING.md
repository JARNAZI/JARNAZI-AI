# Jarnazi DebateAI - Testing Guide

## 🚀 Quick Start Testing

### Step 1: Verify Dev Server
The dev server should be running on: **http://localhost:3000**

### Step 2: Check API Configuration

1. **Open in Browser**: http://localhost:3000/admin/api-status
2. **Click**: "Check Status" button
3. **Expected Result**: You should see which API keys are configured
   - ✅ Green checkmark = API key is configured
   - ⚠️ Yellow warning = API key is missing

### Step 3: Configure AI Providers

If API keys are configured, add AI providers:

1. **Navigate to**: http://localhost:3000/admin/providers
2. **Click**: "Add Node"
3. **Add OpenAI** (if you have the key):
   - Display Name: `ChatGPT`
   - Provider: `openai`
   - Model ID: `gpt-4` (or `gpt-3.5-turbo` for faster/cheaper testing)
   - Category: `text`
   - Priority: `1`
   - Click "Save Node Configuration"

4. **Add DeepSeek** (if you have the key):
   - Display Name: `DeepSeek`
   - Provider: `deepseek`
   - Model ID: `deepseek-chat`
   - Category: `text`
   - Priority: `2`
   - Click "Save Node Configuration"

5. **Optional - Add Wolfram Alpha**:
   - Display Name: `Wolfram Alpha`
   - Provider: `wolfram`
   - Model ID: `YOUR_WOLFRAM_APP_ID` (get from https://products.wolframalpha.com/api/)
   - Category: `math`
   - Priority: `10`
   - Click "Save Node Configuration"

### Step 4: Test a Debate

1. **Navigate to**: http://localhost:3000/debate
2. **Enter a topic**: 
   - Simple: "Should AI be regulated?"
   - Factual (for Wolfram test): "What is the speed of light?"
3. **Click**: "Convene"
4. **Watch**: The debate unfold in real-time
   - Each AI agent should respond in sequence
   - Responses appear as colored cards (OpenAI=green, DeepSeek=blue)
   - Agents should reference each other by name
   - If Wolfram is active, you'll see factual context first

### Step 5: Verify Features

**Real-time Updates**:
- Messages should appear automatically as each AI completes its turn
- No need to refresh the page

**Provider-Specific Styling**:
- OpenAI/ChatGPT: Green border and icon
- DeepSeek: Blue border and icon  
- Wolfram Alpha: Orange border and icon

**Conversation Flow**:
- First agent gives opening statement
- Second agent responds and references first agent
- Agents agree/disagree explicitly

---

## 🔧 Troubleshooting

### Issue: "Insufficient tokens" error
**Solution**: 
1. Go to http://localhost:3000/admin/users
2. Find your user
3. Add tokens to your balance
4. Try starting a debate again

### Issue: "Configuration Error: No active agents found"
**Solution**: 
1. Make sure you've added at least one AI provider in `/admin/providers`
2. Ensure the provider is marked as "active" (green status dot)
3. Verify it's category is `text`

### Issue: API returns "[OpenAI Error: OPENAI_API_KEY not configured]"
**Solution**:
1. Check your `.env.local` file has `OPENAI_API_KEY=sk-...`
2. Restart the dev server after adding keys
3. Or configure keys in Supabase Edge Function Secrets if deploying

### Issue: Debate takes a long time
**Expected**: Each AI call can take 3-10 seconds. A 2-agent debate takes ~20 seconds total.

---

## 📊 Expected Behavior

### Successful Debate Flow:
1. Topic: "Should AI be regulated?"
2. **ChatGPT** (Green): "AI regulation is crucial because..." (~150 words)
3. **DeepSeek** (Blue): "As ChatGPT mentioned, I agree that..." (~150 words)
4. Status updates to "completed"

### With Wolfram Alpha:
1. Topic: "What is pi?"
2. **Wolfram Alpha (Fact Check)**: "Factual context: 3.14159..."
3. **ChatGPT**: References the Wolfram fact in response
4. **DeepSeek**: Also uses the factual data

---

## 🎯 Testing Checklist

- [ ] API Status page shows at least one provider configured
- [ ] Can add AI providers via Admin Dashboard
- [ ] Can start a debate from `/debate` page
- [ ] Debate shows real AI responses (not [Simulated response...])
- [ ] Agents reference each other by name
- [ ] Provider-specific colors display correctly
- [ ] Real-time updates work (no page refresh needed)
- [ ] Token balance decreases after debate
- [ ] Can view past debates from debate dashboard
- [ ] Wolfram Alpha returns factual answers (if configured)

---

## 📝 Notes

- **Cost**: Each debate costs API credits. Use `gpt-3.5-turbo` for cheaper testing
- **Rate Limits**: If you hit rate limits, wait a minute and try again
- **Logs**: Check browser console (F12) and server logs for detailed errors
- **Database**: All debates are saved to Supabase `debates` and `debate_turns` tables
