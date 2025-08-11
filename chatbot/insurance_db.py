INSURANCE_DATABASE = {
    "health": {
        "Basic": {
            "18-25": {
                "premium": "$150-200/month",
                "coverage": "Basic hospitalization & outpatient",
                "deductible": "$1,500",
                "network_hospitals": 500,
                "cashless": True,
                "waiting_period": "30 days for illness, 2 years for pre-existing",
                "exclusions": ["Cosmetic surgery", "Experimental treatments"],
                "add_ons": ["Dental cover", "Maternity cover"]
            },
            "26-35": {
                "premium": "$180-250/month",
                "coverage": "Comprehensive hospitalization & specialist visits",
                "deductible": "$1,200",
                "network_hospitals": 800,
                "cashless": True,
                "waiting_period": "30 days for illness, 2 years for pre-existing",
                "exclusions": ["Alternative medicine", "Hearing aids"],
                "add_ons": ["Vision cover", "Critical illness"]
            }
        },
        "Premium": {
            "18-25": {
                "premium": "$250-350/month",
                "coverage": "Worldwide coverage, zero deductible",
                "deductible": "$0",
                "network_hospitals": 2000,
                "cashless": True,
                "waiting_period": "No waiting for accidents, 6 months for pre-existing",
                "exclusions": ["Non-medically necessary treatments"],
                "add_ons": ["Wellness package", "International evacuation"]
            }
        }
    },
    "life": {
        "Term": {
            "18-30": {
                "premium": "$20-40/month",
                "coverage": "$250,000-500,000",
                "type": "Term life",
                "term_length": "10-30 years",
                "beneficiary_flexibility": True,
                "riders": ["Accidental Death", "Waiver of Premium"],
                "claim_settlement_ratio": "98%"
            }
        },
        "Whole": {
            "31-45": {
                "premium": "$80-150/month",
                "coverage": "$300,000-1,000,000",
                "type": "Whole life",
                "cash_value_accumulation": True,
                "loan_against_policy": True,
                "claim_settlement_ratio": "96%"
            }
        }
    },
    "auto": {
        "Basic": {
            "18-25": {
                "premium": "$120-200/month",
                "coverage": "Liability + Comprehensive",
                "deductible": "$500-1000",
                "roadside_assistance": True,
                "rental_car_cover": False,
                "discounts": ["Safe driver", "Multi-car"],
                "claim_process_time": "5-10 working days"
            }
        },
        "Premium": {
            "26-40": {
                "premium": "$150-250/month",
                "coverage": "Full coverage with zero depreciation",
                "deductible": "$0",
                "roadside_assistance": True,
                "rental_car_cover": True,
                "discounts": ["Safe driver", "Bundled with home insurance"],
                "claim_process_time": "3-5 working days"
            }
        }
    },
    "travel": {
        "Domestic": {
            "any_age": {
                "premium": "$5-20/trip",
                "coverage": "Medical emergencies, trip cancellation",
                "coverage_limit": "$50,000",
                "emergency_evacuation": True,
                "lost_luggage_cover": True
            }
        },
        "International": {
            "any_age": {
                "premium": "$20-100/trip",
                "coverage": "Medical emergencies, trip interruption, evacuation",
                "coverage_limit": "$500,000",
                "emergency_evacuation": True,
                "lost_luggage_cover": True,
                "covid_cover": True
            }
        }
    },
    "home": {
        "Standard": {
            "any_age": {
                "premium": "$30-100/month",
                "coverage": "Fire, theft, natural disaster",
                "deductible": "$500",
                "contents_cover": "$100,000",
                "liability_cover": "$50,000",
                "discounts": ["Smoke detector", "Security system"]
            }
        }
    }
}
