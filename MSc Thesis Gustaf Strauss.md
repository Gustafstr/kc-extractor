# Unlocking Personalized Learning at Scale: Expert‑Validated LLM Pipeline for Knowledge Component Extraction {#unlocking-personalized-learning-at-scale:-expert‑validated-llm-pipeline-for-knowledge-component-extraction}

## 

**Gustaf Strauss**

*MSc Big Data & Artificial Intelligence*   
Montpellier Business School

2025

### 

### **Declaration of Originality** {#declaration-of-originality}

### **Abstract** {#abstract}

### **Acknowledgements** {#acknowledgements}

### **Table of Contents** {#table-of-contents}

[**Unlocking Personalized Learning at Scale: Expert‑Validated LLM Pipeline for Knowledge Component Extraction	1**](#unlocking-personalized-learning-at-scale:-expert‑validated-llm-pipeline-for-knowledge-component-extraction)

[Declaration of Originality	2](#declaration-of-originality)

[Abstract	2](#abstract)

[Acknowledgements	2](#acknowledgements)

[Table of Contents	2](#table-of-contents)

[List of Figures	3](#list-of-figures)

[List of Tables	4](#list-of-tables)

[List of Abbreviations/Nomenclature	4](#list-of-abbreviations/nomenclature)

[Chapter 1: Introduction	5](#chapter-1:-introduction)

[1.1 Background: The Challenge of Personalized Learning and the Role of Knowledge Tracing	5](#1.1-background:-the-challenge-of-personalized-learning-and-the-role-of-knowledge-tracing)

[1.2 Problem Statement: Limitations of Existing KT and the Potential of LLMs	6](#1.2-problem-statement:-limitations-of-existing-kt-and-the-potential-of-llms)

[1.3 Research Questions and Objectives	7](#1.3-research-questions-and-objectives)

[Objectives	8](#objectives)

[1.4 Significance and Contributions of the Research	9](#1.4-significance-and-contributions-of-the-research)

[1.5 Thesis Organization	10](#1.5-thesis-organization)

[Chapter 2: Literature Review and Theoretical Foundations	11](#chapter-2:-literature-review-and-theoretical-foundations)

[2.1 Evolution of Knowledge Tracing: From BKT to Deep Learning Models	11](#2.1-evolution-of-knowledge-tracing:-from-bkt-to-deep-learning-models)

[2.1.1 Bayesian Knowledge Tracing (BKT): Foundations and Limitations	11](#2.1.1-bayesian-knowledge-tracing-\(bkt\):-foundations-and-limitations)

[2.1.2 Deep Learning-based Knowledge Tracing (DKT): Advancements and Challenges	12](#2.1.2-deep-learning-based-knowledge-tracing-\(dkt\):-advancements-and-challenges)

[2.1.3 Hybrid and Other KT Approaches	13](#2.1.3-hybrid-and-other-kt-approaches)

[2.2 The Role of Large Language Models in Educational Technologies	14](#2.2-the-role-of-large-language-models-in-educational-technologies)

[2.2.1 Overview of Large Language Models (LLMs)	15](#2.2.1-overview-of-large-language-models-\(llms\))

[2.2.2 Current Applications of LLMs in Education	15](#2.2.2-current-applications-of-llms-in-education)

[2.2.3 Potential and Challenges of LLMs for Knowledge Tracing	16](#2.2.3-potential-and-challenges-of-llms-for-knowledge-tracing)

[2.3 Defining and Identifying Knowledge Components (KCs) in Educational Content	17](#2.3-defining-and-identifying-knowledge-components-\(kcs\)-in-educational-content)

[2.3.1 Importance of KCs in Learning and Assessment	18](#2.3.1-importance-of-kcs-in-learning-and-assessment)

[2.3.2 Traditional Methods for KC Identification	18](#2.3.2-traditional-methods-for-kc-identification)

[2.3.3 Emerging Approaches: Leveraging NLP and LLMs for KC Extraction	19](#2.3.3-emerging-approaches:-leveraging-nlp-and-llms-for-kc-extraction)

[2.4 Methodologies for Predicting Student Mastery	19](#2.4-methodologies-for-predicting-student-mastery)

[2.5 Gaps motivating an LLM-based KC-extraction study	20](#2.5-gaps-motivating-an-llm-based-kc-extraction-study)

[Chapter 3: Design and Development of LLM-based Knowledge Component Extractor	21](#chapter-3:-design-and-development-of-llm-based-knowledge-component-extractor)

[3.1 System Architecture Overview	21](#3.1-system-architecture-overview)

[3.2 LLM-driven Knowledge Component Identification from Course Materials	22](#3.2-llm-driven-knowledge-component-identification-from-course-materials)

[3.2.1 Input Data: Nature and Pre-processing of Course Materials	22](#3.2.1-input-data:-nature-and-pre-processing-of-course-materials)

[3.2.2 LLM Selection and Configuration for KC Extraction	22](#3.2.2-llm-selection-and-configuration-for-kc-extraction)

[3.2.3 Prompt Engineering for KC Extraction	22](#3.2.3-prompt-engineering-for-kc-extraction)

[3.2.4 Post-processing and Refinement of KCs	22](#3.2.4-evals-for-determaining-output-quality)

[Chapter 4: Validation Framework (Expert Review)	23](#chapter-4:-validation-framework-\(expert-review\))

[4.1 Approach to Validating Knowledge Component Mapping	23](#4.1-approach-to-validating-knowledge-component-mapping)

[4.2 Materials: Course Corpus	23](#4.2-materials:-course-corpus)

[4.3 KC‑Extraction Pipeline (Summary of Chapter 3\)	24](#4.3-kc‑extraction-pipeline-\(summary-of-chapter-3\))

[4.4 Expert Review Design	24](#4.4-expert-review-design)

[4.4.1 Panel Recruitment and Briefing	24](#4.4.1-panel-recruitment-and-briefing)

[4.4.2 Rubric and Instruments	25](#4.4.2-rubric-and-instruments)

[4.4.3 Review Procedure	26](#4.4.3-review-procedure)

[4.5 Quantitative Analysis	26](#4.5-quantitative-analysis)

[4.5.1 Primary Metric: Inter‑rater Agreement (κ)	26](#4.5.1-primary-metric:-inter‑rater-agreement-\(κ\))

[4.5.2 Descriptive Statistics and Redundancy Descriptive Statistics and Redundancy	27](#4.5.2-descriptive-statistics-and-redundancy-descriptive-statistics-and-redundancy)

[4.5.3 Sensitivity and Robustness (optional)	27](#4.5.3-sensitivity-and-robustness-\(optional\))

[4.6 Consensus and Revision Workflow	27](#4.6-consensus-and-revision-workflow)

[4.7 Data Management and Ethics	27](#4.7-data-management-and-ethics)

[4.8 Threats to Validity and Mitigations	28](#4.8-threats-to-validity-and-mitigations)

[4.9 Reporting Plan	28](#4.9-reporting-plan)

[Chapter 5: Results and Discussion	28](#chapter-5:-results-and-discussion)

[5.1 Evaluation of Knowledge Component Mapping	28](#5.1-evaluation-of-knowledge-component-mapping)

[5.1.1 Qualitative Insights from Expert Reviews	29](#5.1.1-qualitative-insights-from-expert-reviews)

[5.1.2 Quantitative Assessment of KC Mapping Quality (Inter-Rater Agreement)	29](#5.1.2-quantitative-assessment-of-kc-mapping-quality-\(inter-rater-agreement\))

[5.2 Discussion: Interpreting the Findings and System Performance	29](#5.2-discussion:-interpreting-the-findings-and-system-performance)

[Chapter 6: Conclusions, Limitations, and Future Directions	29](#chapter-6:-conclusions,-limitations,-and-future-directions)

[6.1 Summary of Key Findings and Contributions	29](#6.1-summary-of-key-findings-and-contributions)

[6.2 Addressing the Research Questions	29](#6.2-addressing-the-research-questions)

[6.3 Limitations of the Current Study and System	30](#6.3-limitations-of-the-current-study-and-system)

[6.4 Implications for Educational Practice and LLM Research	30](#6.4-implications-for-educational-practice-and-llm-research)

[6.5 Recommendations for Future Enhancements and Research Avenues	30](#6.5-recommendations-for-future-enhancements-and-research-avenues)

[References	30](#references)

[Appendices	30](#appendices)

[Appendix A: Expert Review Guidelines and Instruments	30](#appendix-a:-expert-review-guidelines-and-instruments)

[Appendix B: Sample LLM-Generated Knowledge Components	30](#appendix-b:-sample-llm-generated-knowledge-components)

[Appendix C: Detailed Statistical Results for Mastery Prediction	30](#appendix-c:-detailed-statistical-results-for-mastery-prediction)

[Appendix D: Ethical Considerations Statement and Consent Form	31](#appendix-d:-ethical-considerations-statement-and-consent-form)

[Appendix E: Prompt Engineering Examples	31](#appendix-e:-prompt-engineering-examples)

### **List of Figures** {#list-of-figures}

### **List of Tables** {#list-of-tables}

### **List of Abbreviations/Nomenclature** {#list-of-abbreviations/nomenclature}

## 

## **Chapter 1: Introduction** {#chapter-1:-introduction}

Education is undergoing a profound transformation as online platforms expand and educators strive to customize learning for each student. Knowledge Tracing (KT) lies at the heart of adaptive learning, yet traditional and deep‐learning KT models often face challenges in interpretability, cold‐start scenarios, and capturing semantic nuance. At the same time, Large Language Models (LLMs) present a fresh opportunity to derive rich, meaningful Knowledge Components (KCs) from textual data and to automate high-quality KC extraction. 

In this thesis, I present an LLM‑based pipeline that automatically identifies Knowledge Components (KCs) from a single course and I validate the resulting KC set through a structured expert review with inter‑rater agreement (κ) as the primary quantitative outcome.

### 1.1 Background: The Challenge of Personalized Learning and the Role of Knowledge Tracing {#1.1-background:-the-challenge-of-personalized-learning-and-the-role-of-knowledge-tracing}

The rapid expansion of online educational platforms and the increasing availability of large-scale student data have underscored the demand for personalized learning experiences (Teslim, 2024; Zhang et al., 2024). Personalized learning, which tailors instructional content, pace, and support to individual student needs, stands in contrast to traditional one-size-fits-all models that often fail to adequately address diverse learning trajectories (Dunlosky et al., 2013). Effective personalization hinges on the ability to accurately model and predict a student's evolving knowledge state, a task central to the field of Knowledge Tracing (KT) (Cho et al., 2024; Wang et al., 2024).

Knowledge Tracing, a critical component of Intelligent Tutoring Systems (ITS), aims to quantify a learner's understanding of specific concepts or skills—termed Knowledge Components (KCs)—by analyzing their historical interactions with learning materials and assessments (Corbett & Anderson, 1994; Zhu & Chen, 2025). By tracking sequences of student responses, KT models infer the probability of mastery for each KC, providing actionable insights for adaptive learning systems. These systems can then make informed decisions about subsequent content presentation, feedback mechanisms, or remedial interventions, thereby fostering cognitive development and optimizing learning outcomes (Cho et al., 2024; Maity & Deroy, 2024). The fundamental goal of KT is to transform raw interaction data into a dynamic representation of a learner's knowledge, enabling educational technologies to be more responsive and effective. Without robust KT, the promise of truly personalized education remains largely unfulfilled, as systems would lack the granular understanding of individual student needs required for meaningful adaptation (Teslim, 2024).

### 1.2 Problem Statement: Limitations of Existing KT and the Potential of LLMs {#1.2-problem-statement:-limitations-of-existing-kt-and-the-potential-of-llms}

Despite significant advancements, existing KT methodologies face persistent challenges that limit their widespread adoption and efficacy. Traditional models like Bayesian Knowledge Tracing (BKT), while interpretable, often oversimplify the learning process by assuming binary knowledge states (learned/unlearned) and requiring manual, expert-driven definition of KCs (Corbett & Anderson, 1994; Cho et al., 2024). This manual KC definition is a notorious bottleneck, being labor-intensive, subjective, and difficult to scale across diverse curricula (Li et al., 2024, as cited in Cho et al., 2024; Zhu & Chen, 2025).

Deep Learning-based Knowledge Tracing (DLKT) models, such as Deep Knowledge Tracing (DKT) which utilizes Recurrent Neural Networks (RNNs), have demonstrated superior predictive accuracy by capturing complex temporal dependencies in student learning data (Piech et al., 2015; Zhu & Chen, 2025). However, DLKT models are often characterized as "black boxes," offering limited insight into the reasoning behind their predictions, a significant drawback for educators seeking to understand student learning processes (Cho et al., 2024; Zhang et al., 2024). Furthermore, these models typically require large datasets for training and still often rely on pre-defined KCs (Cho et al., 2024; Zhu & Chen, 2025). Some models attempt to address specific aspects like forgetting, but may ignore individual student differences or the causal relationships between KCs (Wang et al., 2024). The challenge of accurately modeling individual question information is also significant, as insufficient interaction data per question can lead to overfitting and inaccurate knowledge state estimations, particularly for less interactive questions (Zhang et al., 2024).

The recent emergence of Large Language Models (LLMs) offers a transformative opportunity to address these limitations (Cho et al., 2024; Maity & Deroy, 2024). LLMs, pre-trained on vast textual corpora, exhibit remarkable capabilities in natural language understanding, generation, and reasoning (Cho et al., 2024). Their proficiency in processing unstructured text suggests a strong potential for automating the arduous task of KC identification directly from course materials like syllabi or textbooks (Cho et al., 2024; Zhu & Chen, 2025). Moreover, LLMs can structure rich domain semantics from course content, reducing reliance on manual KC definition and enabling clearer downstream analyses. Specifically, LLMs can derive KC candidates and item–KC links from content, easing cold-start challenges in later analytic pipelines (Cho et al., 2024). This thesis investigates whether an LLM can extract high‑quality KCs directly from course materials in a form that domain experts consider acceptable for instructional use. The focus is on (i) designing a practical pipeline (prompting \+ post‑processing) and (ii) validating KC quality via an expert rubric and κ. Mastery prediction is acknowledged as an important downstream application but is out of scope for empirical evaluation here and is discussed as future work in Chapter 6\.

### 1.3 Research Questions and Objectives {#1.3-research-questions-and-objectives}

To guide this investigation into an LLM-based KT system, the following primary research question is posed:

**RQ:** *Can a Large Language Model (LLM) extract Knowledge Components (KCs) from one course’s materials at a quality level acceptable to domain experts?*

**Secondary Questions**

**RQ1:** *How do experts rate the accuracy, granularity, clarity, redundancy, and coverage of LLM-generated KCs?*

**RQ2:** *What is the inter-rater agreement (Cohen’s/Fleiss’ κ) on experts’ acceptability judgments of the LLM-generated KCs?*

### **Objectives** {#objectives}

To address the research questions, this thesis pursues the following objectives:

1. **Literature Review.** Conduct a focused review of Knowledge Component (KC) identification methods and the emerging use of Large Language Models (LLMs) in educational contexts.

2. **Pipeline Design.** Develop a prototype LLM-based pipeline that extracts KCs from the materials of a single course, including steps for prompt design, post-processing, and normalization.

3. **Expert Validation.** Implement a structured expert-review process to evaluate the quality of the extracted KCs, using a pre-specified rubric covering accuracy, granularity, clarity, redundancy, and coverage.

4. **Quantitative Analysis.** Measure inter-rater agreement with Cohen’s/Fleiss’ κ as the primary outcome, and complement this with descriptive statistics and qualitative feedback from experts.

5. **Discussion & Implications.** Critically analyze the findings, discuss limitations of the approach, and identify implications for future research and applications of LLMs in education.

These objectives are designed to be Specific, Measurable (through rubric ratings and κ), Achievable within the scope of a master’s thesis, Relevant to the research questions, and Time-bound by the thesis timeline.

### 1.4 Significance and Contributions of the Research {#1.4-significance-and-contributions-of-the-research}

This research is poised to make several significant contributions to the fields of Knowledge Tracing, AI in Education, and personalized learning. The primary novelty lies in isolating and validating the KC-extraction step with Large Language Models. The thesis demonstrates a reproducible pipeline and provides expert-validated evidence of KC quality. 

Potential contributions include:

**Advancements in Knowledge Tracing:**

- **Automation of KC Definition:** A successful LLM-based KC identification module could significantly reduce the time, cost, and subjectivity associated with manual KC definition, a long-standing bottleneck in deploying KT systems at scale (Cho et al., 2024; Zhang et al., 2024). This could democratize the creation of fine-grained KT models across diverse subject areas.  
- **Potentially Improved Accuracy and Granularity:** By leveraging the deep semantic understanding of LLMs, the system may identify more nuanced or contextually relevant KCs than traditional methods (Maity & Deroy, 2024).

**New Applications of LLMs in Education:**

- This work demonstrates a novel and sophisticated application of LLMs in a core educational technology, moving beyond common uses like essay scoring or chatbot interactions (Maity & Deroy, 2024\) to tackle the complex challenge of dynamic student modeling.

**Support for More Effective Personalized Learning Systems:**

- By providing a more efficient and potentially more accurate method for KC extraction this research can contribute to the development of next-generation personalized learning environments that are more adaptive, responsive, and ultimately more effective in supporting individual student learning journeys (Teslim, 2024). The ability to automatically define KCs from new course materials would allow such systems to be more readily adapted to new curricula or domains.

### 1.5 Thesis Organization {#1.5-thesis-organization}

The remainder of this thesis is structured as follows:

**Chapter 2: Literature Review and Theoretical Foundations** provides a comprehensive review of existing research relevant to this study. It covers the evolution of Knowledge Tracing models, the role and applications of Large Language Models in education and methods for defining and identifying Knowledge Components. The chapter concludes by identifying gaps in the current literature that this research aims to address.

**Chapter 3: Design and Development of an LLM-based Knowledge Component Extraction System** details the architecture and implementation of the proposed system. It describes the methodologies for LLM-driven KC identification from course materials using practice data, including specifics on data pre-processing, LLM selection, prompt engineering, and post-processing techniques.

**Chapter** **4:** **Validation Framework (expert review)** outlines the pronged approach used to evaluate the system including rubric design and inter‑rater agreement (κ).

**Chapter 5: Results and Discussion** presents and analyzes the findings from the validation framework. It includes qualitative insights and quantitative data from the KC mapping evaluation.

**Chapter 6: Conclusions, Limitations, and Future Directions** summarizes the key findings and contributions of the thesis, explicitly addresses the research questions, discusses the limitations of the study and the developed system, and explores the implications of the research for educational practice and further LLM research. Finally, it offers recommendations for future enhancements and new research avenues.

## **Chapter 2: Literature Review and Theoretical Foundations** {#chapter-2:-literature-review-and-theoretical-foundations}

This chapter reviews KT, LLMs in education, and KC identification. Methods for predicting student mastery are summarized as background only to situate the present study; they are not evaluated empirically here. The chapter then identifies gaps motivating a KC-extraction study.

### 2.1 Evolution of Knowledge Tracing: From BKT to Deep Learning Models {#2.1-evolution-of-knowledge-tracing:-from-bkt-to-deep-learning-models}

Knowledge Tracing (KT) is a critical task in educational technology, focused on modeling a student's knowledge state over time to predict their future performance and personalize their learning experience (Abdelrahman et al., 2023; Lee et al., 2024). The field has evolved significantly from its initial probabilistic models to more complex deep learning architectures, each offering unique strengths and facing distinct challenges (Corbett & Anderson, 1994; Piech et al., 2015; Zhu & Chen, 2025). Early KT models laid the groundwork by attempting to infer latent knowledge states from observable student interactions, primarily their answers to questions (Corbett & Anderson, 1994). While foundational, these models often relied on simplifying assumptions about the learning process (Zhang et al., 2024). The advent of deep learning marked a paradigm shift, offering powerful tools to capture intricate temporal patterns and dependencies within student learning data (Piech et al., 2015; Zhu & Chen, 2025). However, this advancement also introduced new complexities related to data requirements, model interpretability, and the integration of rich contextual information (Lee et al., 2024; Zhang et al., 2024).

#### **2.1.1 Bayesian Knowledge Tracing (BKT): Foundations and Limitations** {#2.1.1-bayesian-knowledge-tracing-(bkt):-foundations-and-limitations}

Bayesian Knowledge Tracing (BKT), first introduced by Corbett and Anderson (1994), is one of the most foundational and renowned conventional methods in the KT domain (Zhang et al., 2024 11; Zhu & Chen, 2025). BKT models estimate the probability of a student having mastered a particular knowledge component (KC) by analyzing their historical performance on tasks related to that KC (Zhu & Chen, 2025). It operates using a Hidden Markov Model framework, where the student's knowledge state for each KC is a latent binary variable (mastered or not mastered) (Zhang et al., 2024). The model is defined by four main parameters: the initial probability of knowing a skill (P(L₀)), the probability of transitioning from an unlearned state to a learned state (P(T)), the probability of guessing correctly when the skill is not mastered (P(G)), and the probability of slipping (making a mistake) when the skill is mastered (P(S)) (Zhu & Chen, 2025).

Despite its simplicity and interpretability, which established it as a standard in early intelligent tutoring systems, BKT has several inherent limitations (Wang et al., 2024b; Zhu & Chen, 2025). It typically assumes that KCs are learned independently and does not inherently account for the forgetting process, although extensions have been developed to address this (Wang et al., 2024b; Yudelson et al., 2013). Furthermore, BKT often struggles to model intricate learning behaviors or non-linear skill progression patterns due to its simplified assumptions (Zhang et al., 2024; Zhu & Chen, 2025). When dealing with complex correlations between multiple knowledge points or large datasets, its predictive efficacy can diminish (Zhu & Chen, 2025).

#### **2.1.2 Deep Learning-based Knowledge Tracing (DKT): Advancements and Challenges** {#2.1.2-deep-learning-based-knowledge-tracing-(dkt):-advancements-and-challenges}

The emergence of deep learning has significantly advanced the field of Knowledge Tracing, leading to the development of Deep Learning-based Knowledge Tracing (DLKT) models (Piech et al., 2015; Zhu & Chen, 2025). These models, often leveraging architectures like Recurrent Neural Networks (RNNs), Long Short-Term Memory (LSTM) networks, and Transformers, have demonstrated superior predictive accuracy compared to traditional methods like BKT (Kuo et al., 2024; Piech et al., 2015; Wang et al., 2024a; Zhu & Chen, 2025). DKT, for example, utilizes LSTMs to capture temporal dependencies in sequences of student interactions, modeling the evolution of a student's knowledge state as hidden states within the recurrent units (Kuo et al., 2024; Wang et al., 2024a; Zhang et al., 2024). These models can automatically extract features from raw interaction data, simulating complex learning behaviors such as varying learning paces and the dynamic interplay between knowledge acquisition and forgetting (Zhu & Chen, 2025). Enhancements to DKT have included incorporating attention mechanisms (Ghosh et al., 2020; Pandey & Karypis, 2019), graph-based learning (Nakagawa et al., 2019), and textual features from questions (Liu et al., 2019a; Su et al., 2018).

Despite these advancements, DLKT models face several challenges. A primary concern is data dependency; these models often require large datasets for effective training, and their performance can suffer with sparse data (Zhu & Chen, 2025). Overfitting is another significant issue, particularly when modeling individual question information from large question banks where many questions might have limited interaction data (Zhang et al., 2024). Interpretability remains a major hurdle; the "black-box" nature of many deep learning models makes it difficult to understand the reasoning behind their predictions, which can hinder adoption by educators who require insights into student learning processes (Lee et al., 2024; Zhang et al., 2024; Zhu & Chen, 2025). Furthermore, capturing the nuanced effects of forgetting and individual student differences, such as varying cognitive abilities and forgetting rates, remains an active area of research (Wang et al., 2024b). Some models also neglect the rich semantic information in the text of questions and concepts, relying instead on numerical IDs (Lee et al., 2024).

#### **2.1.3 Hybrid and Other KT Approaches** {#2.1.3-hybrid-and-other-kt-approaches}

Beyond BKT and mainstream DLKT models, several other notable KT methodologies and hybrid approaches have emerged, seeking to combine the strengths of different techniques or explore novel modeling paradigms (Zhu & Chen, 2025). Performance Factor Analysis (PFA), for instance, is considered an extension of BKT that incorporates variables such as students’ historical performance, topic difficulty, and knowledge requirements (Pavlik et al., 2009; Zhu & Chen, 2025).

Within the DLKT landscape, models are often categorized based on their core architectures. These include RNN-based models (like DKT and its variants), attention-based models (e.g., SAKT, AKT, RKT), graph-based neural network (GNN) models, memory-augmented models, and adversarial-based models (Wang et al., 2024a; Zhang et al., 2024; Zhu & Chen, 2025). GNN-based models, such as GKT (Nakagawa et al., 2019\) and GIKT (Zhang et al., 2024), represent the learning process as a graph structure, with nodes as KCs and edges as their connections, allowing for flexible modeling of interactions and dependencies (Zhu & Chen, 2025). Memory-augmented models, like Dynamic Key-Value Memory Networks (DKVMN) (Zhang et al., 2017\) and Sequential Key-Value Memory Networks (SKVMN) (Abdelrahman & Wang, 2019; Zhu & Chen, 2025), utilize external memory structures to explicitly store and update information about KCs and student knowledge states.

Hybrid approaches aim to unify the strengths of different methods. For example, some models integrate PLMs with traditional KT methods to leverage textual information (Lee et al., 2024), while others, like the one proposed by Kuo et al. (2024), use diffusion models (TabDDPM) to generate synthetic educational data to augment DKT, addressing data scarcity issues. The Language model-based Knowledge Tracing (LKT) framework integrates encoder-based PLMs with KT methods, effectively incorporating semantic information from text (Lee et al., 2024). These diverse approaches highlight the ongoing effort to create more robust, accurate, and interpretable KT systems.

### **2.2 The Role of Large Language Models in Educational Technologies** {#2.2-the-role-of-large-language-models-in-educational-technologies}

Large Language Models (LLMs) have rapidly emerged as transformative technologies with significant potential across various domains, including education (Wang et al., 2025; Zhu & Chen, 2025). Their advanced capabilities in natural language understanding, generation, and reasoning are paving the way for novel applications in educational settings, from personalized learning support to sophisticated content creation (Edwards-Fapohunda & Adediji, 2024; Wang et al., 2025). AI-driven adaptive learning platforms, often incorporating LLM technologies, are increasingly recognized for their ability to tailor educational experiences to individual student needs, thereby enhancing engagement and learning outcomes, particularly in distance education (Edwards-Fapohunda & Adediji, 2024; Kuo et al., 2024).

#### 2.2.1 Overview of Large Language Models (LLMs) {#2.2.1-overview-of-large-language-models-(llms)}

Large Language Models are a class of artificial intelligence models characterized by their massive scale, typically involving billions of parameters, and their training on vast quantities of text and code data (Wang et al., 2025). Architecturally, many state-of-the-art LLMs, such as LLaMA (Touvron et al., 2023, as cited in Wang et al., 2025\) and models like ChatGPT (OpenAI, 2023, as cited in Jemstedt et al., 2024), are based on the Transformer architecture (Vaswani et al., 2017). This architecture utilizes self-attention mechanisms to process input sequences in parallel, allowing LLMs to effectively capture long-range dependencies and contextual relationships in language (Wang et al., 2024a). The training process for LLMs usually involves a pre-training phase on extensive unlabeled text corpora, where the model learns general linguistic patterns, followed by a fine-tuning phase on more specific, often task-oriented, datasets to adapt its capabilities for particular applications (Lee et al., 2024; Wang et al., 2025). Key capabilities of LLMs include sophisticated natural language understanding, coherent and contextually relevant text generation, instruction following, few-shot learning, and complex reasoning, including mathematical and logical problem-solving (Wang et al., 2025; Zhu & Chen, 2025). Some LLMs are designed as mixtures of experts (MoE) to scale to trillions of parameters efficiently (Fedus et al., 2022; Lepikhin et al., 2020).

#### 2.2.2 Current Applications of LLMs in Education {#2.2.2-current-applications-of-llms-in-education}

LLMs are increasingly being integrated into educational technologies to support a wide range of activities (Edwards-Fapohunda & Adediji, 2024; Jemstedt et al., 2024). One prominent application is in the development of AI-driven adaptive learning platforms that personalize educational pathways by adjusting content difficulty and pace based on real-time student performance and preferences (Edwards-Fapohunda & Adediji, 2024; Kuo et al., 2024). These platforms often use LLMs for generating tailored feedback, creating interactive content, and suggesting relevant learning resources (Kuo et al., 2024).

Students are also leveraging LLMs like ChatGPT and NotebookLM as study aids to explain complex topics, summarize articles, and even generate practice questions (Jemstedt et al., 2024). For instance, NotebookLM can create summaries or even podcasts from articles, allowing students to consume information in different modalities (Jemstedt et al., 2024). Other applications include automated scoring of essays and assignments, development of intelligent tutoring systems that can engage in conversational learning with students, and generation of diverse educational content, such as quizzes, lesson plans, and explanatory materials (Abdul Rahman et al., 2022; Kuo et al., 2024). Desired features from students often revolve around AI tools providing easy-to-understand explanations, practice exam questions, and validation of generated content (Jemstedt et al., 2024).

#### 2.2.3 Potential and Challenges of LLMs for Knowledge Tracing {#2.2.3-potential-and-challenges-of-llms-for-knowledge-tracing}

The integration of LLMs into Knowledge Tracing (KT) holds significant promise for enhancing the accuracy and richness of student modeling (Lee et al., 2024; Wang et al., 2025; Zhu & Chen, 2025). LLMs' inherent ability to understand and reason with natural language can allow KT systems to leverage the rich semantic information contained in question texts and concept descriptions, moving beyond reliance on numerical IDs (Lee et al., 2024; Wang et al., 2025). This can lead to more nuanced predictions of student performance and a better understanding of their knowledge states (Lee et al., 2024). LLMs can also address the cold-start problem in KT by using their pre-trained semantic knowledge to make predictions even for new questions or concepts with limited interaction data (Lee et al., 2024; Zhu & Chen, 2025). Furthermore, the reasoning capabilities of LLMs could provide more interpretable insights into why a student might be struggling or succeeding (Lee et al., 2024; Wang et al., 2025). Frameworks like LKT (Lee et al., 2024\) and LLM-KT (Wang et al., 2025\) are examples of efforts to integrate LLMs with KT, demonstrating improved performance and enhanced interpretability.

However, applying LLMs directly to KT presents several challenges (Wang et al., 2025). One major hurdle is that LLMs, primarily trained on textual data, may struggle to effectively capture the sequential interaction behaviors typically represented by sequences of IDs in traditional KT datasets (Wang et al., 2025). They might interpret these IDs merely as numbers without understanding the underlying student interaction patterns. Another challenge lies in handling the long textual contexts of extensive problem-solving records, as student histories can involve hundreds of questions, potentially exceeding the effective context window of some LLMs (Wang et al., 2025). The "black-box" nature of LLMs can also be a concern for interpretability, although some research aims to make their outputs more transparent (Lee et al., 2024; Wang et al., 2025). Additionally, the computational cost of using very large LLMs can be prohibitive. Data limitations, such as the scarcity of publicly available KT datasets with rich textual features, and the need to extend models to handle multi-modal educational data, also pose ongoing challenges (Lee et al., 2024).

### 2.3 Defining and Identifying Knowledge Components (KCs) in Educational Content {#2.3-defining-and-identifying-knowledge-components-(kcs)-in-educational-content}

Knowledge Components (KCs) are fundamental units of knowledge, skill, or principle that students need to acquire to master a domain (Zhang et al., 2024). They serve as the basis for structuring educational content, designing assessments, and modeling student learning in KT systems. The precise definition and identification of KCs are crucial for effective instruction and accurate assessment of student understanding (Wang et al., 2024b; Zhang et al., 2024). For example, in a mathematics course, KCs might include "integer distributive law" or "multi-digit calculation" (Zhang et al., 2024). In digital literacy, a KC could be "knowing how to detect phishing emails" (Jemstedt et al., 2024). The hierarchical relationships and dependencies between KCs also play a significant role in the learning process, as mastery of prerequisite KCs often influences the learning of more advanced ones (Wang et al., 2024b).

#### 2.3.1 Importance of KCs in Learning and Assessment {#2.3.1-importance-of-kcs-in-learning-and-assessment}

Well-defined KCs play a critical role in effective learning, instruction, and assessment (Zhang et al., 2024). For learners, clear KCs provide a roadmap of what needs to be learned. For instructors, they guide the design of curricula, instructional activities, and targeted feedback (Hattie & Timperley, 2007). In the context of KT, KCs are the granular elements upon which student knowledge states are modeled and predicted (Zhang et al., 2024). The accuracy of a KT model heavily relies on the quality and granularity of the KCs it uses. If KCs are poorly defined or too broad, the model may fail to capture the nuances of student learning. Conversely, well-defined KCs allow for a more precise understanding of a student's strengths and weaknesses, enabling personalized interventions and learning pathways (Wang et al., 2024b). The hierarchical structure among KCs is also vital, as forgetting a foundational KC can impact the understanding of related, more complex KCs (Wang et al., 2024b). Assessments designed around specific KCs can provide actionable insights into student mastery at a fine-grained level, informing both students and teachers about areas needing further attention (Hattie & Timperley, 2007).

#### 2.3.2 Traditional Methods for KC Identification {#2.3.2-traditional-methods-for-kc-identification}

Traditionally, the identification and definition of KCs have relied on manual or semi-automated techniques involving domain expertise (Zhang et al., 2024). Cognitive Task Analysis (CTA) is one such method, where experts analyze the cognitive processes involved in performing a task to break it down into constituent KCs. Another common approach involves expert annotation of educational materials and assessment items to create a Q-matrix (Tatsuoka, 1983). A Q-matrix is a binary matrix that maps questions or items to the KCs they are intended to assess (Zhang et al., 2024 shows an example Question-KC Relation Matrix). This process typically requires significant effort from subject matter experts to ensure the KCs are accurate, comprehensive, and at an appropriate level of granularity for the educational context. While these methods can produce high-quality KC models, they are often time-consuming, labor-intensive, and may suffer from inter-rater reliability issues if not carefully managed.

#### 2.3.3 Emerging Approaches: Leveraging NLP and LLMs for KC Extraction {#2.3.3-emerging-approaches:-leveraging-nlp-and-llms-for-kc-extraction}

Recent advancements in Natural Language Processing (NLP) and the advent of LLMs are opening new avenues for automating or semi-automating the extraction of KCs from educational content (Zhu & Chen, 2025). LLMs, with their profound understanding of text and semantic relationships, can analyze large volumes of educational materials, such as textbooks, articles, and lecture transcripts, to identify potential KCs. For example, the Enhanced Code Knowledge Tracing (ECKT) model utilizes an LLM to analyze code written by students and automatically generate topic descriptions, relevant knowledge points (KCs), and their difficulty levels (Zhu & Chen, 2025). This approach can significantly reduce the manual effort required in traditional KC identification methods. While the primary focus of many current LLM applications in KT is on using textual information related to pre-defined KCs, the underlying capabilities of LLMs to process and structure textual data suggest a strong potential for their application in the KC extraction phase itself. The ability to understand semantic nuances and relationships within text makes LLMs promising tools for identifying fine-grained KCs and their interconnections from diverse educational resources.

### 2.4 Methodologies for Predicting Student Mastery {#2.4-methodologies-for-predicting-student-mastery}

Predicting student mastery of KCs is a central goal of KT and adaptive learning systems (Zhang et al., 2024 64). Various methodologies and metrics are employed to infer and predict a student's level of understanding or proficiency. KT models, by definition, aim to track these evolving knowledge states based on interaction histories (Corbett & Anderson, 1994; Piech et al., 2015). For instance, DKT models predict a student's response to a new question based on their historical interactions (Kuo et al., 2024), implicitly reflecting their mastery of the underlying KCs. Frameworks like Q-MCKT explicitly model students’ knowledge acquisition states at both the question and concept (KC) levels to make predictions (Zhang et al., 2024).

The evaluation of these prediction models commonly involves metrics such as Accuracy, Precision, Recall, and Area Under the ROC Curve (AUC) (Kuo et al., 2024). Accuracy measures the proportion of correctly predicted student answers, while precision and recall assess the model's ability to correctly identify positive instances (e.g., correct answers) and capture all actual positive instances, respectively (Kuo et al., 2024). AUC is a widely used metric that gauges a binary classifier's efficacy in distinguishing between classes (e.g., correct vs. incorrect responses), with higher AUC indicating better performance (Kuo et al., 2024).

Beyond direct prediction of responses, student mastery can also be conceptualized through formative assessment and feedback mechanisms. Hattie and Timperley (2007), emphasize that effective feedback helps students understand "Where am I going?" (goals), "How am I going?" (progress towards goals), and "Where to next?" (activities to improve progress), thereby reducing the discrepancy between current understanding and desired mastery. In some research, mastery is defined by performance thresholds, such as answering more than 80% of test questions correctly after a learning module (Jemstedt et al., 2024). Item Response Theory (IRT) is another psychometric approach sometimes integrated into KT to model student abilities and item difficulties, providing a basis for mastery estimation (Wang et al., 2024a; Zhang et al., 2024).

### 2.5 Gaps motivating an LLM-based KC-extraction study {#2.5-gaps-motivating-an-llm-based-kc-extraction-study}

The review highlights a persistent bottleneck: crafting high-quality, fine-grained KCs at scale. This study targets that gap by operationalizing an LLM pipeline for KC extraction on a single course and **validating** the resulting KC set with a rubric and κ

Firstly, while traditional DLKT models have improved predictive accuracy, they often struggle with interpretability and fully leveraging the rich semantic content of educational materials (Lee et al., 2024; Zhang et al., 2024; Zhu & Chen, 2025). LLMs, with their advanced natural language understanding and reasoning capabilities, offer a pathway to create more interpretable KT models that can explain their predictions and provide richer insights into student learning (Lee et al., 2024; Wang et al., 2025). 

Secondly, the process of KC identification and modeling could be significantly enhanced by LLMs. While ECKT demonstrates the potential for LLMs to automatically generate KCs from code (Zhu & Chen, 2025), more research is needed to develop and validate LLM-based methods for KC extraction across diverse educational domains and content types. 

Finally, students perceive a gap in current AI study tools regarding trustworthiness and efficiency, particularly for tasks like summarizing, understanding, memorizing, and applying information (Jemstedt et al., 2024). An LLM-based KC Extraction system that incorporates features for validating its outputs (e.g., by referencing source materials) and offers interactive learning support could address these student needs (Jemstedt et al., 2024). The challenge of insufficient data, poor interpretability, and ensuring model compatibility across different educational scenarios are overarching concerns that an advanced LLM-based system should aim to mitigate (Zhu & Chen, 2025).

Addressing these gaps through an LLM-based KC extraction system could lead to more accurate, interpretable, personalized, and efficient educational tools that better support student learning and mastery.

## **Chapter 3: Design and Development of LLM-based Knowledge Component Extractor** {#chapter-3:-design-and-development-of-llm-based-knowledge-component-extractor}

This chapter should detail the architectural design, components, and development process of the proposed LLM-based Knowledge Component Extractor

### **3.1 System Architecture Overview** {#3.1-system-architecture-overview}

This section should describe the overall structure of the proposed system, outlining its main modules and the flow of data between them.

### **3.2 LLM-driven Knowledge Component Identification from Course Materials** {#3.2-llm-driven-knowledge-component-identification-from-course-materials}

This section should explain the design and methodology of the module responsible for automatically identifying Knowledge Components from educational content using an LLM.

#### **3.2.1 Input Data: Nature and Pre-processing of Course Materials** {#3.2.1-input-data:-nature-and-pre-processing-of-course-materials}

This subsection should describe the types of course materials the system will use as input and the necessary pre-processing steps before LLM analysis.

#### **3.2.2 LLM Selection and Configuration for KC Extraction** {#3.2.2-llm-selection-and-configuration-for-kc-extraction}

This subsection should detail the criteria for selecting an appropriate LLM for KC extraction and the specific configuration parameters to be used.

#### **3.2.3 Prompt Engineering for KC Extraction** {#3.2.3-prompt-engineering-for-kc-extraction}

This subsection should explain the iterative process of designing and refining prompts to guide the LLM in accurately identifying Knowledge Components.

#### **3.2.4 Evals for determaining output quality** {#3.2.4-evals-for-determaining-output-quality}

This subsection should describe the steps taken to clean, filter, de-duplicate, and potentially structure the raw Knowledge Components output by the LLM.

**3.2.4 Graph based workflows**

**3.2.5 Agents vs Workflows**

## 

## Chapter 4: Validation Framework (Expert Review) {#chapter-4:-validation-framework-(expert-review)}

This chapter defines the validation framework for a single empirical contribution: assessing the quality of Knowledge Components (KCs) extracted from one course by a Large Language Model (LLM). The objective is to establish, with defensible evidence, whether the LLM‑generated KCs meet expert‑acceptable standards for instructional use.

### 4.1 Approach to Validating Knowledge Component Mapping {#4.1-approach-to-validating-knowledge-component-mapping}

The primary method for validating the LLM-driven KC identification module is through qualitative expert review. This approach acknowledges that the "correctness" of KCs is often a nuanced judgment best made by individuals with deep subject matter expertise. The credibility of this validation hinges significantly on the careful selection of experts and the clarity of the evaluation protocol provided to them.

The validation strategy mirrors the research questions: (1) expert judgements of KC quality across a rubric (accuracy, granularity, clarity, redundancy, and coverage), and (2) inter‑rater agreement quantified via kappa (κ). The design yields both qualitative evidence (expert comments and ratings) and quantitative reliability (κ with confidence intervals). The KC list under review is the output of the pipeline specified in Chapter 3\.

Primary outcome. Inter‑rater agreement (Cohen’s κ for two raters; Fleiss’ κ for ≥3 raters) on an "Acceptable / Marginal / Unacceptable" label derived from the rubric.

Secondary outcomes. Descriptive statistics of rubric ratings (means, SDs), redundancy counts/merges, and thematic synthesis of expert comments.

### 

### 4.2 Materials: Course Corpus {#4.2-materials:-course-corpus}

Describe the single course from which KCs were extracted. Include a brief rationale for domain selection (availability of experts, curricular importance, variety of concepts). Provide a concise corpus profile:

* **Source(s):** instructor slides, readings, assignments, quizzes (list each).  
* **Subject/domain:** e.g., Python fundamentals / Introductory Mechanics.  
* **Type of material:** textbooks, slides, handouts, LMS exports.  
* **Size:** pages/words/modules; number of assessments/items.  
* **Key topics:** short bullet list aligned with the syllabus.  
* **Language:** e.g., English/Swedish.

*Recommended table placement:* **Table 4.2. Characteristics of Course Materials** (as in Chapter 3 → keep numbering consistent with your global list of tables).

### 4.3 KC‑Extraction Pipeline (Summary of Chapter 3\) {#4.3-kc‑extraction-pipeline-(summary-of-chapter-3)}

For traceability, summarize the exact pipeline that produced the KC list evaluated here (refer to Chapter 3 for full details):

1. **Model & configuration:** LLM family/version and key decoding parameters (e.g., temperature, max tokens).  
2. **Prompting:** final prompt template and any guardrails that constrain **granularity** and **format** (e.g., one KC per line, non‑overlapping, action‑verb phrasing).  
3. **Post‑processing:** normalization, de‑duplication, merging near‑synonyms, and mapping to course objectives.  
4. **Deliverable for review:** a KC list with stable IDs (KC‑001 … KC‑N), each with: short label, one‑sentence description, and optional evidence pointer (citation to source page/slide/section).

### 4.4 Expert Review Design {#4.4-expert-review-design}

#### 4.4.1 Panel Recruitment and Briefing {#4.4.1-panel-recruitment-and-briefing}

* **Eligibility:** ≥2–3 years of teaching in the focal subject; advanced degree or equivalent instructional‑design experience.  
* **Panel size:** **N \= 2–3** experts (Cohen’s κ for two; Fleiss’ κ for three).  
* **Briefing pack:** (a) KC definition for this study, (b) original course materials, (c) finalized KC list with IDs, (d) evaluation rubric and instructions, (e) standardized rating form, (f) anonymity and data‑use statement.  
* **Blinding:** Experts rate independently; no discussion until after initial submissions.


#### 4.4.2 Rubric and Instruments {#4.4.2-rubric-and-instruments}

Experts evaluate each KC on the following dimensions:

* **Accuracy (1–5):** Does the KC accurately represent a core concept, skill, or piece of information present in the source material? Is it factually correct within the domain?  
* **Granularity (1–5):**  Is the KC at an appropriate level of detail?  
  * Not too broad (e.g., "Chapter 1 understanding" is too broad).  
  * Not too specific/trivial (e.g., "knowing the definition of 'the'" is too specific).  
  * It should represent a meaningful unit for learning and assessment.  
* **Clarity (1–5):** Is the KC phrased clearly and unambiguously? Is it easily understandable by an educator or a student in the domain?  
* **Redundancy (Yes/No):** Are there KCs in the list that are highly similar or effectively duplicates of other KCs, perhaps phrased differently?  
* **Coverage (set‑level):** (Assessed globally for the entire set of KCs) Do the KCs, as a whole, adequately cover the important topics and learning objectives presented in the relevant section of the course material? Are there any significant omissions?


**Acceptability label.** For each KC, raters also assign an overall **Acceptable / Marginal / Unacceptable** label (used for κ). A KC is *Acceptable* if it would be usable, with at most minor edits; *Marginal* if substantial edits are needed; *Unacceptable* if it should be removed or replaced.

**Rating form.** One row per KC with fields: ID, short label, Accuracy, Granularity, Clarity, Redundant (Y/N), Acceptability, and Comments (free text). Provide a separate page for set‑level Coverage plus *suggested merges/splits/re‑phrasings*.

#### 4.4.3 Review Procedure {#4.4.3-review-procedure}

1. **Orientation (15–20 min):** Provide definitions, examples of good/poor KCs, and practice with 2–3 sample KCs not used in analysis.  
2. **Independent rating (asynchronous):** Experts rate the full KC set (or a randomized representative sample if N is large).  
3. **Quality checks:** Verify form completeness; resolve obvious clerical errors (missing Likert value) without altering judgements.  
4. **Lock ratings** for analysis; store raw forms and a CSV export in the project archive.

### 4.5 Quantitative Analysis {#4.5-quantitative-analysis}

#### 4.5.1 Primary Metric: Inter‑rater Agreement (κ) {#4.5.1-primary-metric:-inter‑rater-agreement-(κ)}

* **Statistic.** Compute inter‑rater agreement on the ordinal **Acceptable / Marginal / Unacceptable** labels derived from the rubric (see §4.4.2). Use **Cohen’s κ** for two raters or **Fleiss’ κ** for ≥3.  
* **Weighting (recommended).** Because labels are ordinal, report **weighted κ** (linear or quadratic) alongside the unweighted κ as a sensitivity check.  
* **Estimation.** Provide the point estimate and **95% confidence interval** (asymptotic or bootstrap).  
* **Category sparsity.** If any category has \<5% of ratings, consider (and report) a **collapsed-category analysis** (e.g., *Marginal* merged with the nearest class) to avoid unstable estimates.  
* **Interpretation.** Interpret κ using standard qualitative bands (e.g., slight → almost‑perfect) but emphasize **task context** (KC difficulty, number of categories) rather than thresholds alone.

#### 4.5.2 Descriptive Statistics and Redundancy Descriptive Statistics and Redundancy {#4.5.2-descriptive-statistics-and-redundancy-descriptive-statistics-and-redundancy}

* For Accuracy, Granularity, and Clarity: means, SDs, and distribution plots (optional).  
* **Redundancy:** count duplicate flags per KC; propose merges; compute % of KCs retained after de‑duplication.  
* **Coverage:** summarize set‑level ratings (mean, SD) and list any missing objectives identified by ≥2 experts.

#### 4.5.3 Sensitivity and Robustness (optional) {#4.5.3-sensitivity-and-robustness-(optional)}

* **Category collapse:** Re‑compute κ after collapsing *Marginal* with the nearest class (e.g., Acceptable) to test stability.  
* **Post‑processing impact:** Compare κ before vs. after the final de‑duplication pass to show the value of normalization.  
* 

### 4.6 Consensus and Revision Workflow {#4.6-consensus-and-revision-workflow}

After independent ratings:

1. **Synthesis memo:** Aggregate comments and propose a *merge/split/re‑phrase* plan for disputed KCs.  
2. **Consensus meeting (≤60 min):** Experts discuss only flagged KCs; aim to decide *keep as is*, *edit*, *merge*, or *remove*.  
3. **Final KC set:** Publish a change log (KC‑ID → action, rationale). Optionally re‑solicit a fast acceptability check on edited items (not used for κ).

### 4.7 Data Management and Ethics {#4.7-data-management-and-ethics}

* **Data stored:** rating forms, CSV exports, KC list, change log, and meeting notes.  
* **Anonymity:** store rater identifiers separately from ratings; report only aggregate results.  
* **Consent:** obtain written consent from experts; include an information sheet and withdrawal option.  
* **Archiving:** deposit anonymized artifacts (KC list, rubric, and aggregate stats) in the thesis appendix or an OSF repository.

### 4.8 Threats to Validity and Mitigations {#4.8-threats-to-validity-and-mitigations}

* **Construct validity:** Misaligned KC definition → mitigate with clear examples and a practice calibration.  
* **Rater bias:** Small panel size → use structured rubric, independent ratings, and κ with CIs; document rater backgrounds.  
* **Sampling:** If sub‑sampling KCs, randomize and ensure coverage of all syllabus topics.  
* **Over‑granularity/under‑granularity:** Enforce guardrails in prompts; use expert feedback to tune granularity.  
* **External validity:** Single‑course scope limits generalization → position replication across courses as future work.

### 4.9 Reporting Plan {#4.9-reporting-plan}

Present results in Chapter 5 as follows:

1. **Qualitative insights** (themes and exemplar comments).  
2. **Kappa with 95% CI** and a short interpretation.  
3. **Descriptives** for rubric ratings and coverage; **redundancy resolution** summary.  
4. **Final KC inventory** (post‑consensus) with IDs and one‑line definitions.

## **Chapter 5: Results and Discussion** {#chapter-5:-results-and-discussion}

This chapter should present and critically analyze the empirical findings from the validation experiments described in Chapter 4, addressing the system's performance.

### **5.1 Evaluation of Knowledge Component Mapping** {#5.1-evaluation-of-knowledge-component-mapping}

This section should report the results of the expert evaluation of the LLM-generated Knowledge Components, including qualitative feedback and quantitative agreement measures.

#### **5.1.1 Qualitative Insights from Expert Reviews** {#5.1.1-qualitative-insights-from-expert-reviews}

This subsection should synthesize the domain experts' feedback on the accuracy, granularity, coverage, redundancy, and clarity of the LLM-generated KCs.

#### **5.1.2 Quantitative Assessment of KC Mapping Quality (Inter-Rater Agreement)** {#5.1.2-quantitative-assessment-of-kc-mapping-quality-(inter-rater-agreement)}

This subsection should present and interpret the calculated inter-rater agreement statistic (Kappa value) concerning the experts' evaluations of the KCs.

### **5.2 Discussion: Interpreting the Findings and System Performance** {#5.2-discussion:-interpreting-the-findings-and-system-performance}

This section should synthesize all results, discuss their interrelations, assess the overall success of the system, compare findings with existing literature, and explicitly revisit the research questions.

## 

## **Chapter 6: Conclusions, Limitations, and Future Directions** {#chapter-6:-conclusions,-limitations,-and-future-directions}

This chapter should summarize the entire thesis, reiterate key findings, discuss contributions, acknowledge limitations, and suggest avenues for future research.

### **6.1 Summary of Key Findings and Contributions** {#6.1-summary-of-key-findings-and-contributions}

This section should concisely restate the most important outcomes of the research and highlight the main contributions to the field.

### **6.2 Addressing the Research Questions** {#6.2-addressing-the-research-questions}

This section should explicitly revisit each research question posed in Chapter 1 and explain how the study's findings provide answers to them.

### **6.3 Limitations of the Current Study and System** {#6.3-limitations-of-the-current-study-and-system}

This section should critically discuss the limitations of the research, including aspects related to sample size, LLM specificity, evaluation methods, and system design.

### **6.4 Implications for Educational Practice and LLM Research** {#6.4-implications-for-educational-practice-and-llm-research}

This section should explore the potential impact of the research findings on educational practices and future LLM research in education.

### **6.5 Recommendations for Future Enhancements and Research Avenues** {#6.5-recommendations-for-future-enhancements-and-research-avenues}

This section should propose specific directions for future work, including potential system improvements, further validation studies, and new research questions emerging from this thesis.

## **References** {#references}

This section should contain a comprehensive list of all academic and other sources cited throughout the thesis, formatted according to a consistent citation style.

## **Appendices** {#appendices}

This section will contain supplementary materials that support the main text of the thesis but are too detailed or extensive for inclusion in the body.

### **Appendix A: Expert Review Guidelines and Instruments** {#appendix-a:-expert-review-guidelines-and-instruments}

This appendix should contain the exact materials provided to domain experts for the evaluation of Knowledge Components.

### **Appendix B: Sample LLM-Generated Knowledge Components** {#appendix-b:-sample-llm-generated-knowledge-components}

This appendix should provide illustrative examples of KCs produced by the LLM, possibly with expert annotations.

### **Appendix C: Detailed Statistical Results for Mastery Prediction** {#appendix-c:-detailed-statistical-results-for-mastery-prediction}

This appendix should present any detailed statistical tables or analyses related to the mastery prediction results that are too granular for the main text.

### **Appendix D: Ethical Considerations Statement and Consent Form** {#appendix-d:-ethical-considerations-statement-and-consent-form}

This appendix should include the formal statement on ethical considerations and a copy of the participant consent form.

### **Appendix E: Prompt Engineering Examples** {#appendix-e:-prompt-engineering-examples}

This appendix should offer more extensive or varied examples of the prompts used to interact with the LLM for both KC extraction and mastery prediction.

