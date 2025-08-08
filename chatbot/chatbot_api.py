from .state import ChatbotState
from .insurance_db import INSURANCE_DATABASE
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from config import Config
import json
import re
from langchain_core.prompts import ChatPromptTemplate
from typing import TypedDict, List, Optional, Dict, Any
class InsuranceChatbotAPI:
    def __init__(self, llm_api_key: str = None):
        self.llm_api_key = llm_api_key or Config.GROQ_API_KEY
        if not self.llm_api_key:
            raise ValueError("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it directly.")
        
        self.llm =  ChatGroq(api_key=Config.GROQ_API_KEY, model="llama3-70b-8192", temperature=0)
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow with LLM integration"""
        graph = StateGraph(ChatbotState)
        
        # Add nodes
        graph.add_node("extract_info_with_llm", self._extract_info_with_llm)
        graph.add_node("ask_followup_with_llm", self._ask_followup_with_llm)
        graph.add_node("search_documents", self._search_documents)
        graph.add_node("generate_response_with_llm", self._generate_response_with_llm)
        
        # Define edges
        graph.add_conditional_edges(
            "extract_info_with_llm",
            self._should_collect_info,
            {
                "collect_info": "ask_followup_with_llm",
                "search_docs": "search_documents"
            }
        )
        
        graph.add_edge("ask_followup_with_llm", END)
        graph.add_edge("search_documents", "generate_response_with_llm")
        graph.add_edge("generate_response_with_llm", END)
        
        # Set entry point
        graph.set_entry_point("extract_info_with_llm")
        
        return graph.compile()
    
    async def _extract_info_with_llm(self, state: ChatbotState) -> ChatbotState:
        """Use LLM to extract age and insurance type from user message"""
        user_message = state["user_query"]
        
        extraction_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are an information extraction assistant. 
            Extract the user's age and insurance type from their message.
            
            Return ONLY a JSON object with this format:
            {"age": number_or_null, "insurance_type": "health/life/auto_or_null"}
            
            Examples:
            - "I'm 25 and need health insurance" -> {"age": 25, "insurance_type": "health"}
            - "Looking for car insurance" -> {"age": null, "insurance_type": "auto"}
            - "I need insurance" -> {"age": null, "insurance_type": null}"""),
            HumanMessage(content=f"Extract from: {user_message}")
        ])
        
        try:
            llm_response = await self.llm.ainvoke(extraction_prompt.format_messages())
            extracted_data = json.loads(llm_response.content)
            if extracted_data["age"] is not None:
                state["user_age"] = extracted_data["age"]

            if extracted_data["insurance_type"] is not None:
                state["insurance_type"] = extracted_data["insurance_type"]
            
                
        except (json.JSONDecodeError, Exception):
            # Fallback to regex if LLM fails
            age_match = re.search(r'\b(\d{1,2})\b', user_message)
            if age_match and 18 <= int(age_match.group(1)) <= 100:
                state["user_age"] = int(age_match.group(1))
        missing_info = []
        if not state.get("user_age"):
            missing_info.append("age")
        if not state.get("insurance_type"):
            missing_info.append("insurance_type")
        state["missing_info"] = missing_info
        return state
    
    def _should_collect_info(self, state: ChatbotState) -> str:
        """Decide next step based on available information"""
        missing_info = []
        if not state.get("user_age"):
            missing_info.append("age")
        if not state.get("insurance_type"):
            missing_info.append("insurance_type")
        
        state["missing_info"] = missing_info
        print("Collect info state for missing:", state)
        if missing_info:
            return "collect_info"
        else:
            return "search_docs"
    
    async def _ask_followup_with_llm(self, state) -> ChatbotState:

        """Use LLM to generate natural follow-up questions"""
        print("state in follow up:", state)
        missing_info = state.get("missing_info", [])
        conversation_history = state.get("messages", [])
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in conversation_history[-3:]
        ])
        
        followup_prompt = ChatPromptTemplate.from_messages([
            SystemMessage(content="""You are a friendly insurance assistant. 
            CRITICAL RULES:
                
                1. ONLY ask for the missing information: {', '.join(missing_info)}
                2. DO NOT ask about coverage details, family members, medical conditions, etc.
                3. Keep it simple and direct
                4. Available insurance types: health, life, auto
                5. Only ask for the missing information, nothing else!
                
                Current user info:
                - Age: {state.get('user_age', 'unknown')}
                - Insurance type: {state.get('insurance_type', 'unknown')}"""),
                HumanMessage(content=f"""
                Missing information that I need: {', '.join(missing_info)}
                
                Generate a simple, direct question asking ONLY for the missing information.
                Do not ask about anything else!""")
        ])
        
        try:
            llm_response = await self.llm.ainvoke(followup_prompt.format_messages())
            response = llm_response.content
        except Exception as e:
            # Fallback response if LLM fails
            if "age" in missing_info and "insurance_type" in missing_info:
                response = "Hi! I'd be happy to help you find insurance options. Could you tell me your age and what type of insurance you're looking for? (health, life, or auto)"
            elif "age" in missing_info:
                response = "Could you please tell me your age so I can find the best insurance options for you?"
            elif "insurance_type" in missing_info:
                response = "What type of insurance are you interested in? I can help with health, life, or auto insurance."
            else:
                response = "I need a bit more information to help you better."
        
        state["last_response"] = response
        state["messages"].append({"role": "assistant", "content": response})
        return state
    
    def _search_documents(self, state: ChatbotState) -> ChatbotState:
        """Search insurance documents"""
        age = state["user_age"]
        insurance_type = state["insurance_type"]
        
        age_bracket = self._get_age_bracket(age, insurance_type)
        
        relevant_docs = []
        if insurance_type in INSURANCE_DATABASE and age_bracket in INSURANCE_DATABASE[insurance_type]:
            doc = INSURANCE_DATABASE[insurance_type][age_bracket]
            relevant_docs.append({
                "insurance_type": insurance_type,
                "age_bracket": age_bracket,
                "data": doc
            })
        
        state["relevant_docs"] = relevant_docs
        return state
    
    async def _generate_response_with_llm(self, state: ChatbotState) -> ChatbotState:
        """Use LLM to generate final response with insurance information"""
        relevant_docs = state["relevant_docs"]
        user_age = state["user_age"]
        insurance_type = state["insurance_type"]
        
        if not relevant_docs:
            try:
                no_results_prompt = ChatPromptTemplate.from_messages([
                    SystemMessage(content="You are a helpful insurance assistant. Generate a polite response when no insurance options are found."),
                    HumanMessage(content=f"No insurance options found for {insurance_type} insurance for age {user_age}. Suggest contacting support.")
                ])
                llm_response = await self.llm.ainvoke(no_results_prompt.format_messages())
                response = llm_response.content
            except Exception:
                response = f"I apologize, but I couldn't find specific {insurance_type} insurance options for your age group. Please contact our support team for personalized assistance."
        else:
            doc_data = relevant_docs[0]["data"]
            
            insurance_info = f"""
            Insurance Type: {insurance_type.title()}
            Age: {user_age}
            Premium: {doc_data.get('premium', 'Contact for quote')}
            Coverage: {doc_data.get('coverage', 'Standard coverage')}
            Deductible: {doc_data.get('deductible', 'N/A')}
            """
            
            try:
                response_prompt = ChatPromptTemplate.from_messages([
                    SystemMessage(content="""You are a helpful insurance assistant. 
                    Present insurance information in a friendly, well-formatted way using emojis and clear structure.
                    Be enthusiastic but professional."""),
                    HumanMessage(content=f"""
                    Present this insurance information to the user:
                    {insurance_info}
                    
                    Make it engaging and ask if they want more details.
                    """)
                ])
                
                llm_response = await self.llm.ainvoke(response_prompt.format_messages())
                response = llm_response.content
            except Exception:
                response = f"""🎯 Great! I found {insurance_type} insurance options for you:
📊 **Premium**: {doc_data.get('premium', 'Contact for quote')}
🛡️ **Coverage**: {doc_data.get('coverage', 'Standard coverage')}
💰 **Deductible**: {doc_data.get('deductible', 'N/A')}

Would you like more details about this plan or have any questions? 😊"""
        
        state["last_response"] = response
        state["messages"].append({"role": "assistant", "content": response})
        return state
    
    def _get_age_bracket(self, age: int, insurance_type: str) -> str:
        """Get age bracket for insurance type"""
        if insurance_type == "health":
            if 18 <= age <= 25: return "18-25"
            elif 26 <= age <= 35: return "26-35"
            elif 36 <= age <= 50: return "36-50"
            elif 51 <= age <= 65: return "51-65"
        elif insurance_type == "life":
            if 18 <= age <= 30: return "18-30"
            elif 31 <= age <= 45: return "31-45"
            elif 46 <= age <= 60: return "46-60"
        elif insurance_type == "auto":
            if 18 <= age <= 25: return "18-25"
            elif 26 <= age <= 40: return "26-40"
            elif 41 <= age <= 65: return "41-65"
        return "general"
    
    async def chat(self, user_input: str, state: Optional[ChatbotState] = None) -> tuple[str, ChatbotState]:
        """Main chat interface"""
        if state is None:
            state = ChatbotState(
                messages=[],
                user_age=None,
                insurance_type=None,
                user_query="",
                relevant_docs=[],
                missing_info=[],
                conversation_stage="start",
                last_response=""
            )
        
        state["messages"].append({"role": "user", "content": user_input})
        state["user_query"] = user_input
        
        # Run the graph
        result = await self.graph.ainvoke(state)
        
        return result["last_response"], result