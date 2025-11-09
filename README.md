# 🍽️ DoorSmashOrPass

**HackUMass XIII Submission**

A campus food delivery platform that connects students with student couriers while providing AI-powered nutrition coaching.

## 💡 Inspiration

Ever rushed between classes, craving a quick bite but with no time to pick up food? We've all been there. We created DoorSmashOrPass to solve this everyday campus struggle—connecting hungry students with student couriers for fast, flexible food delivery, all while helping everyone make healthier choices.

## 🎯 What It Does

DoorSmashOrPass is a campus food delivery platform that connects students with student couriers, creating flexible income opportunities while making food more accessible.

**Key Features:**
- **Student-to-Student Delivery**: Earn money delivering grab-and-go meals between classes
- **Nutrition Tracking**: Automatic calorie, protein, carb, and fat tracking for every campus dining option
- **AI Nutrition Coach**: An agentic chatbot powered by voice and text that takes orders, answers nutrition questions, and provides personalized dietary guidance
- **Voice Ordering**: Seamless voice-based ordering powered by ElevenLabs

## 🛠️ How We Built It

We used **Claude Code** for rapid development and **Lovable** for our frontend, building a full-stack application with:

**Tech Stack:**
- **Frontend**: React + Vite
- **Backend**: FastAPI (Python)
- **Database**: Supabase
- **Voice AI**: ElevenLabs for speech recognition and text-to-speech
- **AI Agent**: Pydantic AI with Gemini integration
- **Cloud Infrastructure**: AWS Lambda, AWS Elastic Container Registry
- **Payment Processing**: Stripe
- **Web Scraping**: Automated nutrition data extraction from UMass dining menus
- **Containerization**: Docker

**Architecture:**
1. **Scraping Service**: AWS Lambda functions with custom Docker images scrape real-time dining hall menus
2. **Voice AI Layer**: ElevenLabs integration for natural conversation and ordering
3. **API Layer**: FastAPI backend serves menu data, handles orders, and processes payments
4. **Database**: Supabase for user data, orders, and nutrition tracking
5. **Frontend**: React application with real-time updates

## 🚧 Challenges We Faced

### AWS Lambda Package Size Limits
Our initial scraping packages exceeded Lambda's size constraints. We solved this by implementing **Lambda Layers** to modularize dependencies.

### Playwright Browser Compatibility
The headless browser was too resource-intensive for Lambda's execution environment. We pivoted to creating a **custom Docker image** and deploying it through **AWS Elastic Container Registry**, enabling scalable browser automation.

### Real-time Data Accuracy
Managing frequent menu changes and ensuring nutritional information remains accurate required building a robust scraping system that handles edge cases and inconsistent HTML structures.

## 🏆 Accomplishments That We're Proud Of

- ✅ Successfully integrating **ElevenLabs** for seamless voice ordering and nutrition coaching
- ✅ Building a scalable **AWS infrastructure** that can handle multiple campuses
- ✅ Creating an **AI agent** that actually understands student dietary needs
- ✅ Developing a **real-time scraping system** that keeps nutrition data accurate and up to date
- ✅ Implementing **Stripe payment flows** for secure transactions

## 📚 What We Learned

This project pushed us to master:
- Stripe payment flows and webhook handling
- AWS serverless architecture (Lambda, ECR, Lambda Layers)
- ElevenLabs voice AI integration
- Docker containerization for complex dependencies
- Building production-ready scrapers at scale
- Integrating Pydantic AI with Gemini for agentic behavior

## 🔮 What's Next for DoorSmashOrPass

We're ready to scale. Our vision is to **expand to colleges nationwide and eventually globally**, integrating with campus dining systems everywhere. 

**Future Plans:**
- 🌎 Multi-campus expansion
- 🤝 Integration with campus dining systems
- 📱 Mobile app development
- 🎯 Advanced meal planning features
- 👥 Social features for group orders
- 🏋️ Fitness tracker integration

We believe every student deserves convenient access to food and the ability to make informed nutrition choices. **We're actively seeking investment** to bring DoorSmashOrPass to campuses across the country.

## 🎬 Demo

[Link to demo video or live demo]

## 👥 Team

- **Adriana Caraeni** - Frontend design, DevPost, technology research & implementation
- **Riddhimaan Senapati** - AWS infrastructure, ElevenLabs integration, Gemini agentic chatbot
- **Neha Kotturu** - Frontend development with Supabase + Stripe integration, UMass dining scraper setup
- **Haluk Yuzukirmizi** - [Role/Contribution]
- **Egemen Dag** - [Role/Contribution]
- **Saukhya Shinde** - [Role/Contribution]

## 🛠️ Built With

- Amazon Web Services (Lambda, ECR)
- ElevenLabs
- FastAPI
- Lovable
- Pydantic AI
- React
- Supabase
- Vite
- Stripe
- Docker
- Gemini

## 🔗 Links

- **GitHub Repository**: [Add link]
- **Live Demo**: [Add link]

## 🙏 Acknowledgments

- HackUMass XIII organizers and sponsors
- UMass Dining Services for accessible menu information
- Claude Code for rapid development
- ElevenLabs for voice AI technology

## 📝 License

GNU General Public License v3.0

---

**Built with ❤️ at HackUMass XIII**
