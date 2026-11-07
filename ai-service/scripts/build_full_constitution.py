"""
Script to build the complete Constitution of India (all 506 articles)
and Landmark Supreme Court Case Precedents for Court Clash.
"""
import json
import os
import re

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
RAW_ARTICLES_PATH = os.path.join(DATA_DIR, "raw_full_articles.jsonl")
OUTPUT_CONSTITUTION_PATH = os.path.join(DATA_DIR, "indian_constitution.json")
OUTPUT_CASES_PATH = os.path.join(DATA_DIR, "landmark_cases.json")

def clean_text(text: str) -> str:
    """Removes footnote references like 1[, 2[, etc. and unprintable artifacts."""
    if not text:
        return ""
    # Remove footnote markers like 1[ or 2[ or ]
    text = re.sub(r'\d+\[', '', text)
    for ch in ['[', ']', '*']:
        text = text.replace(ch, '')
    # Replace smart quotes with standard quotes
    text = text.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def build_full_constitution():
    print(f"Reading raw articles from: {RAW_ARTICLES_PATH}")
    assert os.path.exists(RAW_ARTICLES_PATH), f"File not found: {RAW_ARTICLES_PATH}"

    articles = []
    
    # 1. Preamble first
    articles.append({
        "number": "Preamble",
        "title": "Preamble to the Constitution of India",
        "part": "Preamble",
        "text": (
            "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a "
            "SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: "
            "JUSTICE, social, economic and political; "
            "LIBERTY of thought, expression, belief, faith and worship; "
            "EQUALITY of status and of opportunity; and to promote among them all "
            "FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation; "
            "IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, "
            "ENACT AND GIVE TO OURSELVES THIS CONSTITUTION."
        )
    })

    with open(RAW_ARTICLES_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            art_num = item.get("article_number", "").strip()
            title = clean_text(item.get("article_title", "").strip())
            part_num = item.get("part_number", "").strip()
            part_title = clean_text(item.get("part_title", "").strip())
            text = clean_text(item.get("text", "").strip())

            # Format article number cleanly
            if not art_num.lower().startswith("article"):
                formatted_num = f"Article {art_num}"
            else:
                formatted_num = art_num

            # Format part string
            if part_num and part_title:
                part_str = f"Part {part_num} - {part_title.title()}"
            elif part_title:
                part_str = part_title.title()
            else:
                part_str = ""

            articles.append({
                "number": formatted_num,
                "title": title,
                "part": part_str,
                "text": text
            })

    output_data = {
        "id": "indian_constitution",
        "name": "The Constitution of India (Complete)",
        "description": "Full official Constitution of India containing all parts, fundamental rights, directive principles, judiciary, emergency provisions, and amendments.",
        "articles": articles
    }

    with open(OUTPUT_CONSTITUTION_PATH, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    print(f"[OK] Successfully built {len(articles)} articles into: {OUTPUT_CONSTITUTION_PATH}")
    return len(articles)

def build_landmark_cases():
    """Builds the Landmark Supreme Court of India precedents dataset."""
    landmark_cases = {
        "id": "indian_case_law",
        "name": "Supreme Court of India Landmark Precedents",
        "description": "Authoritative constitutional rulings of the Supreme Court of India defining fundamental rights, basic structure, and judicial review.",
        "articles": [
            {
                "number": "Kesavananda Bharati v. State of Kerala (1973)",
                "title": "Basic Structure Doctrine & Limits on Amending Power",
                "part": "Judicial Precedent - Constitutional Supremacy",
                "text": (
                    "Citation: (1973) 4 SCC 225. A historic 13-judge bench held that Parliament's constituent power to amend the "
                    "Constitution under Article 368 is wide, but not unlimited. Parliament cannot amend, alter, or destroy the "
                    "'Basic Structure' or essential constitutional framework (including democracy, republican form of government, "
                    "secularism, separation of powers, and judicial review). Overruled Golaknath and preserved constitutional supremacy."
                )
            },
            {
                "number": "Maneka Gandhi v. Union of India (1978)",
                "title": "Golden Triangle of Articles 14, 19, and 21 - Just, Fair, and Reasonable Law",
                "part": "Judicial Precedent - Personal Liberty",
                "text": (
                    "Citation: 1978 AIR 597. The Supreme Court revolutionized Article 21 by holding that 'procedure established by law' "
                    "cannot be arbitrary, fanciful, or oppressive; it must satisfy the test of being just, fair, and reasonable. "
                    "Established the 'Golden Triangle'—holding that Articles 14 (Equality), 19 (Freedoms), and 21 (Life and Liberty) "
                    "are not isolated silos but are intimately interconnected. Natural justice and audi alteram partem are implicit in Article 21."
                )
            },
            {
                "number": "Justice K.S. Puttaswamy v. Union of India (2017)",
                "title": "Fundamental Right to Privacy under Article 21",
                "part": "Judicial Precedent - Privacy & Informational Autonomy",
                "text": (
                    "Citation: (2017) 10 SCC 1. A unanimous 9-judge bench held that the Right to Privacy is a fundamental and inalienable "
                    "right intrinsic to life and personal liberty under Article 21, and part of the freedoms guaranteed by Part III. "
                    "Privacy encompasses bodily integrity, personal autonomy, and informational privacy. Any state encroachment on privacy "
                    "must satisfy legality, legitimate state aim, and proportionality."
                )
            },
            {
                "number": "Navtej Singh Johar v. Union of India (2018)",
                "title": "Decriminalization of Consensual LGBTQ+ Relations & Constitutional Morality",
                "part": "Judicial Precedent - Equality & Dignity",
                "text": (
                    "Citation: (2018) 1 SCC 791. A 5-judge constitution bench unanimously struck down Section 377 of the Indian Penal Code "
                    "to the extent it criminalized consensual same-sex acts between adults. Held that discrimination based on sexual orientation "
                    "violates Article 14 (Equality), Article 15 (Non-discrimination on grounds of sex), and Article 21 (Dignity and Personal Autonomy). "
                    "Courts must uphold 'Constitutional Morality' over popular or majoritarian morality."
                )
            },
            {
                "number": "Shreya Singhal v. Union of India (2015)",
                "title": "Freedom of Speech Online & Striking down Section 66A IT Act",
                "part": "Judicial Precedent - Freedom of Speech",
                "text": (
                    "Citation: (2015) 5 SCC 1. Struck down Section 66A of the Information Technology Act, 2000 as unconstitutional for "
                    "violating freedom of speech and expression under Article 19(1)(a). The Court drew a clear distinction between "
                    "'discussion', 'advocacy', and 'incitement', ruling that mere advocacy or discussion of an unpopular cause cannot "
                    "be penalized unless it reaches the threshold of clear and imminent incitement."
                )
            },
            {
                "number": "Vishaka v. State of Rajasthan (1997)",
                "title": "Protection Against Workplace Sexual Harassment",
                "part": "Judicial Precedent - Gender Equality & Dignity",
                "text": (
                    "Citation: (1997) 6 SCC 241. In the absence of enacted domestic legislation, the Supreme Court laid down legally binding "
                    "'Vishaka Guidelines' under Article 32 and Article 141 to prevent sexual harassment of women at the workplace. "
                    "Held that sexual harassment violates women's fundamental rights to equality (Articles 14 & 15), life and liberty (Article 21), "
                    "and right to practice any profession (Article 19(1)(g))."
                )
            },
            {
                "number": "Indira Sawhney v. Union of India (1992)",
                "title": "Mandal Case - 50% Ceiling on Reservations & Creamy Layer",
                "part": "Judicial Precedent - Social Justice & Affirmative Action",
                "text": (
                    "Citation: 1993 Supp (3) SCC 217. A 9-judge bench upheld 27% reservation for Other Backward Classes (OBCs) under "
                    "Article 16(4), but established two crucial constitutional safeguards: (1) Total reservations must not exceed the 50% limit "
                    "in ordinary circumstances to preserve efficiency and equality under Article 16(1); and (2) Advanced sections of backward classes "
                    "('Creamy Layer') must be excluded from affirmative action benefits."
                )
            },
            {
                "number": "Minerva Mills Ltd. v. Union of India (1980)",
                "title": "Harmonious Balance between Fundamental Rights and Directive Principles",
                "part": "Judicial Precedent - Constitutional Balance",
                "text": (
                    "Citation: (1980) 3 SCC 625. Struck down clauses (4) and (5) of Article 368 inserted by the 42nd Amendment which sought "
                    "to bar judicial review. Reaffirmed that the harmony and balance between Fundamental Rights (Part III) and Directive Principles "
                    "(Part IV) is an essential feature of the Basic Structure. Fundamental Rights are the ends, and DPSP are the means; neither "
                    "can be exalted over the other to destroy the constitutional fabric."
                )
            },
            {
                "number": "Shayara Bano v. Union of India (2017)",
                "title": "Abolition of Instant Triple Talaq (Talaq-e-Biddat)",
                "part": "Judicial Precedent - Gender Justice & Non-Arbitrariness",
                "text": (
                    "Citation: (2017) 9 SCC 1. A 5-judge constitution bench by majority held instant Triple Talaq (Talaq-e-Biddat) to be unconstitutional "
                    "and void. Held that unilateral, irrevocable divorce without reconciliation is manifestly arbitrary and violates Article 14. "
                    "Practices that violate the dignity of women cannot claim protection under Article 25 (Freedom of Religion)."
                )
            },
            {
                "number": "S.R. Bommai v. Union of India (1994)",
                "title": "Federalism, Secularism, and Judicial Review of Article 356",
                "part": "Judicial Precedent - Federalism & Emergency Powers",
                "text": (
                    "Citation: (1994) 3 SCC 1. A 9-judge bench curbed the arbitrary dismissal of state governments by the central executive under "
                    "Article 356 (President's Rule). Ruled that the proclamation of President's Rule is subject to judicial review. Declared "
                    "Secularism and Federalism to be integral parts of the Basic Structure. The floor test in the Legislative Assembly is the "
                    "sole constitutional method to test the majority of a government."
                )
            },
            {
                "number": "Romesh Thappar v. State of Madras (1950)",
                "title": "Freedom of the Press & Circulation",
                "part": "Judicial Precedent - Press Freedom",
                "text": (
                    "Citation: 1950 AIR 124. Held that the freedom of speech and expression under Article 19(1)(a) includes the freedom of propagation "
                    "of ideas, which is ensured by the freedom of circulation. A government ban on the entry and circulation of a journal in a State "
                    "is unconstitutional unless strictly justified under Article 19(2)."
                )
            },
            {
                "number": "Olga Tellis v. Bombay Municipal Corporation (1985)",
                "title": "Right to Livelihood is Inseparable from Right to Life",
                "part": "Judicial Precedent - Economic Dignity & Housing",
                "text": (
                    "Citation: (1985) 3 SCC 545. A 5-judge bench ruled that the Right to Livelihood is an integral part of the Right to Life "
                    "under Article 21. If the right to livelihood were not treated as part of the constitutional right to life, the easiest way of "
                    "depriving a person of his life would be to deprive him of his means of earning a living. State evictions require procedural "
                    "fairness and natural justice."
                )
            }
        ]
    }

    with open(OUTPUT_CASES_PATH, "w", encoding="utf-8") as f:
        json.dump(landmark_cases, f, indent=2, ensure_ascii=False)

    print(f"[OK] Successfully built {len(landmark_cases['articles'])} landmark cases into: {OUTPUT_CASES_PATH}")

if __name__ == "__main__":
    build_full_constitution()
    build_landmark_cases()
