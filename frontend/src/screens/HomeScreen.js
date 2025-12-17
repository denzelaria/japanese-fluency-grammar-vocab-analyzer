import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Fade, Modal } from 'react-bootstrap'
import { GoogleGenAI } from "@google/genai"
import LoadingComponent from '../components/LoadingComponent';

const HomeScreen = () => {
  const [ai, setAi] = useState(null)
  const [working, setWorking] = useState(false)
  const [sentence, setSentence] = useState("")
  const [score, setScore] = useState("")
  const [color, setColor] = useState("")
  const [alternate, setAlternate] = useState("")
  const [problems, setProblems] = useState("")
  const [formality, setFormality] = useState("none")
  const [done, setDone] = useState(false)
  const [type, setType] = useState(0)
  const [results, setResults] = useState([])
  const [dictionary, setDictionary] = useState({})
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false)
  const [tokenizer, setTokenizer] = useState(null)
  const [translation, setTranslation] = useState("")
  const [error, setError] = useState("")
  const [change, setChange] = useState(false)
  const [open, setOpen] = useState(false)  
  const [toTran, setToTran] = useState("")

  const getEnSent = async () => {
    try {
        setToTran("")
        setFormality("")
        setError("")
        const abouts = [
            "the speaker:aka the person saying the sentence.",
            "the general public/society",
            "the person youre talking to",
            "the group youre talking to",
            "a 3rd person not in the conversation",
        ]
        const sentenceStructures = [
            "simple statement about",
            "asking for opinion on",
            "opinion on",
            "plan related to",
            "complaint about",
            "asking for help to do something in the topic of",
            "suggestion for"
        ];
        const topics = [
            "a specific person or country in politics",
            "your daily routine and schedule", 
            "food, meals or cuisines",
            "plans for weekends or holidays",
            "weather and seasonal activities",
            "a random sport",
            "shopping and new products",
            "health, and self-care routines",
            "school/university/studies",
            "family, friends, and relationships",
            "work, studies, and future goals",
            "travel experiences in abroad",
            "public transport or personal transport",
            "household chores and home life",
            "a random form of entertainment (movies, music, books)",
            "current events and personal observations"
        ];
        const mathCalc0 = await Math.floor(Math.random()*5)
        const mathCalc = await Math.floor(Math.random()*16)
        const mathCalc1 = await Math.floor(Math.random()*7)
        const topic = topics[mathCalc]
        const struct = sentenceStructures[mathCalc1]
        const about = abouts[mathCalc0]
        console.log(topic)
        console.log(struct)
        console.log(about)
        const data = await ai.models.generateContent({
                model:"gemini-2.5-flash",
                contents:`You need to help people learning japanese by providing an english sentence(ONLY 1, PRETTY SHORT SENTENCE) for them to try and translate into japanese. The sentence should be in the form of a speaker, should use normal day-to-day words, and should be understandable even without any context, examples: 'I dont think salmon is much better than tuna.', 'Have you gone to the gym yet today?', 'I cant stand people in japan. Theyre so stupid.'. Respond with nothing except the sentence you give. You should make the sentence about: ${struct} ${topic} with the target of the topic/convo being ${about}, and in a casual tone, but make sure to include specific nouns when possible.`,
                config:{ 
                    temperature:0.8,
                    maxOutputTokens:1500,
                    candidateCount: 1,
                }
            })
        const mathCalc2 = await Math.floor(Math.random()*3)
        const forms = ["formal","normal","casual"]
        setFormality(forms[mathCalc2])
        setToTran(data.text)
    }catch(error) {
        alert(error)
        setDone(false)
        setWorking(false)
        setError("Error occured. AI may be experiencing too much requests or is temporarily shut down. Please try again later (should work after a few seconds to a minute)")
    }
  }

  const getTranslation = async (text) => {
    try {
        const res = await fetch(
            `https://lingva.ml/api/v1/ja/en/${encodeURIComponent(text)}`
        );
        setTranslation((await res.json()).translation)
    }catch(error) {
        alert(error)
        setWorking(false)
        setDone(false)
        setError("Translation failed. Please try again later.")
    }
  }

  const getMeaning = (word) => {
    const isKatakana = (text) => /^[\u30A0-\u30FF]+$/.test(text);
    const q = dictionary.filter(item => {
        if (isKatakana(word.basic_form)) {
            return item.kana?.some(kanaObj => kanaObj.text === word.basic_form);
        } else {
            return item.kanji?.some(kanjiObj => kanjiObj.text === word.basic_form)
        }
    });
    if (q.length > 0) {
        console.log(q)
        return {
            word: word.basic_form,
            reading: q[0].kana[0].text,
            meaning: q[0].sense[0].gloss[0].text
        }
    }
    return
  }

  const analyze = async (text) => {
    setWorking(true)
    setDone(false)
    try {
        if (!tokenizer) {
            alert('Japanese analyzer is not ready yet.')
            return
        }
        if (!dictionaryLoaded) {
            alert('Dictionary is still loading. Please wait...')
            return
        }
        const tokens = await tokenizer.tokenize(text)
        const foundResults = (await Promise.all(
            tokens.map(token => getMeaning(token))
        )).filter(result => result !== undefined);
        setResults(foundResults)
        setWorking(false)
        setDone(true)
    }catch(error) {
        alert(error)
        setWorking(false)
        setDone(false)
        setError("Error with dictionary. Please try again later.")
    }
  }

  const handleSubmit = async (e) => {
    try {
        e.preventDefault()
        if (sentence.length === 0) {
            alert("Please enter something")
        }else {
            setError("")
            setDone(false)
            setWorking(true)
            setChange(false)
            setScore("")
            setResults([])
            setTranslation("")
            var addition = ""
            if (type === 2 && toTran) {
                addition = " Original sentence which the user was supposed to translate into japanese based on:"+toTran
            }else {
                addition = ""
            }
            if (type === 0 || type === 2) {
                const data = await ai.models.generateContent({
                    model:"gemini-2.5-flash",
                    contents:"Text to analyze:"+ sentence+ "Formality:"+ formality+addition,
                    config:{ 
                        temperature:0.2,
                        maxOutputTokens:4000,
                        candidateCount: 1,
                        systemInstruction: {
                            parts: [{ 
                                text: `
                                You are a language prompt criticizer based on how fluent and accurate their language is.
                                You will be given a prompt and formality, which can be none(so how fluent in general it is), formal, or casual. 
                                Mark scheme:
                                grammar:50%, 
                                vocabulary:10%, 
                                naturalness(formality and informality will go in this category):40%. 
                                if the sentence they gave, is not japanese then give it a 0. youre goal is to analyze japanese sentences, and respond in english. if the given japanese sentence does not form a complete, logical sentence and does not fit any context, give it a 0-10%, for example if its a single word with no context like an exclamation mark or question mark.
                                Respond in EXACTLY this format:
                                score/100@problems but talk about only issues, be specific@alternate, improved Japanese version
                                Also, write only maximum of 120 words MAKE SURE TO MAKE RESPONSE EXTREMELY SHORT and make sure to put @ between the score, problems and alternate(no spaces) so i can split them. Please make sure that you speak in english.
                                `}]
                        }
                    }
                })
                const resparr = data.text.split("@")
                setScore(resparr[0].split("/")[0])
                setProblems(resparr[1])
                setAlternate(resparr[2])
                if (Number(resparr[0].split("/")[0]) >= 90) {
                    setColor("#47F244")
                }else if (Number(resparr[0].split("/")[0]) >= 80 && Number(resparr[0].split("/")[0]) < 90) {
                    setColor("#95f244ff")
                }else if (Number(resparr[0].split("/")[0]) >= 70 && Number(resparr[0].split("/")[0]) < 80) {
                    setColor("#b8f244ff")
                }else if (Number(resparr[0].split("/")[0]) >= 60 && Number(resparr[0].split("/")[0]) < 70) {
                    setColor("#ecf244ff")
                }else if (Number(resparr[0].split("/")[0]) >= 50 && Number(resparr[0].split("/")[0]) < 60) {
                    setColor("#f2db44ff")
                }else if (Number(resparr[0].split("/")[0]) >= 40 && Number(resparr[0].split("/")[0]) < 50) {
                    setColor("#F2B844")
                }else if (Number(resparr[0].split("/")[0]) >= 30 && Number(resparr[0].split("/")[0]) < 40) {
                    setColor("#F29544")
                }else if (Number(resparr[0].split("/")[0]) >= 20 && Number(resparr[0].split("/")[0]) < 30) {
                    setColor("#F26D44")
                }else if (Number(resparr[0].split("/")[0]) >= 10 && Number(resparr[0].split("/")[0]) < 20) {
                    setColor("#F25544")
                }else if (Number(resparr[0].split("/")[0]) >= 0 && Number(resparr[0].split("/")[0]) < 10) {
                    setColor("#F24444")
                }
            }else if (type === 1) {
                analyze(sentence)
                await getTranslation(sentence)
            }
            setDone(true)
            setWorking(false)
        }
    } catch(error) {
        alert(error)
        setDone(false)
        setWorking(false)
        setError("Error occured. AI may be experiencing too much requests or is temporarily shut down. Please try again later (should work after a few seconds to a minute)")
    }
  }

  useEffect(() => {
    if (!ai && process.env.REACT_APP_GEMINI_API_KEY) {
        const initai = new GoogleGenAI({
            apiKey : process.env.REACT_APP_GEMINI_API_KEY || ''
        });
        setAi(initai)
    }
    const initializeKuromoji = () => {
        // Check if kuromoji is available
        if (typeof window.kuromoji === 'undefined') {
        setTimeout(initializeKuromoji, 1000); // Retry after 1 second
        return;
        }
        
        window.kuromoji.builder({ 
        dicPath: "/dict/" 
        }).build(function (err, newTokenizer) {
        if (err) {
            console.error('Kuromoji initialization error:', err);
            alert('Failed to load Japanese analyzer. Please check if dictionary files are in public/dict/');
            return;
        }
        setTokenizer(newTokenizer);
        });
    };
    const loadDictionary = async () => {
        try {
            const response = await fetch('/data/jmdict-eng-common-3.6.1.json')
            if (!response.ok) {
                throw new Error(`Failed to load dictionary: ${response.status}`)
            }
            const data = await response.json()
            if (data.words) {
                setDictionary(data.words)
            }else {
                setDictionary(data)
            }
            setDictionaryLoaded(true)
        }catch(error) {
            setDictionaryLoaded(true)
        }
    }
    initializeKuromoji();
    loadDictionary();
    }, []);

  return (
    <>
        <Container className="p-0 m-0 h-auto w-100 d-flex flex-column justify-content-center align-items-center">
            <Container className="animate__animated animate__fadeInUp shadow-custom d-flex flex-row mt-3 justify-content-center align-items-center w-75 rounded-4" style={{backgroundColor:"#282c31"}} fluid>
                <Row className="d-flex w-100" fluid>
                    <Col className="menu p-0 m-0 text-center text-decoration-none" lg={4} md={4} sm={4} xs={4}>
                        <Button className="select-option bg-transparent border-0 d-flex justify-content-center align-items-center text-center m-0 p-0 h-100 w-100" onClick={() => {setType(0); setDone(false); setWorking(false);setChange(true)}}>Fluency evaluator</Button>
                    </Col>
                    <Col className="menu p-0 m-0 text-center text-decoration-none border-end border-start borderman border-4 text-decoration-none" lg={4} md={4} sm={4} xs={4}>
                        <Button className="select-option bg-transparent border-0 d-flex justify-content-center align-items-center text-center m-0 p-3 h-100 w-100" onClick={() => {setType(2); setDone(false); setWorking(false);setChange(true)}}>Practice</Button>
                    </Col>
                    <Col className="menu p-0 m-0 text-center text-decoration-none" lg={4} md={4} sm={4} xs={4}>
                        <Button className="select-option bg-transparent border-0 d-flex justify-content-center align-items-center text-center m-0 p-3 h-100 w-100" onClick={() => {setType(1); setDone(false); setWorking(false);setChange(true)}}>Word extractor</Button>
                    </Col>
                </Row>
            </Container>
            <Container className="animate__animated animate__fadeInUp mainman d-flex flex-column w-75 p-5 my-3 rounded-4 shadow-custom" style={{backgroundColor:"#282c31"}} fluid>
                <Form onSubmit={(e) => handleSubmit(e)}data-bs-theme="dark" className="d-flex flex-column justify-content-center align-items-center w-100" style={{backgroundColor:"#282c31"}} fluid>
                    {
                        type === 2 &&
                            <Row className="d-flex flex-row m-0 w-100 p-0" fluid>
                                <Container className="d-flex flex-column justify-content-center align-items-center sent-d py-4 px-3 mb-2 w-100" fluid>
                                    { toTran &&
                                        <>
                                            <p className="m-0">Try to say in japanese:</p>
                                            <h3 className="m-0 my-3 text-center">{toTran}</h3>
                                            <p>(in a {formality} tone)</p>
                                        </>
                                    }
                                    <Button className="oneb border-0" style={{backgroundColor:"#282c31"}} onClick={getEnSent}>Generate english sentence</Button>
                                </Container>
                            </Row>
                    }
                    <Row className="d-flex flex-row w-100 justify-content-center align-items-center">
                        <Col sm={8} md={9} lg={10} xl={10} className="d-flex m-0 p-0 justify-content-center align-items-center">
                            <Form.Group className="w-100">
                                <Form.Control className="rounded-pill px-3 py-2 w-100" value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Enter japanese text here"></Form.Control>
                            </Form.Group>
                        </Col>
                        <Col className="d-flex m-0 p-0 justify-content-center align-items-center" sm={4} md={3} lg={2} xl={2}>
                            <Button className="subbut rounded-pill py-2" style={{width:"90%",}}type="submit">Submit</Button>
                        </Col>
                    </Row>
                    { type === 0 ? 
                        <Form.Group className="d-flex w-100 justify-content-center my-3">
                            <Row className="d-flex flex-row  justify-content-between" style={{width:"300px"}}>
                                <Col className="d-flex justify-content-center" lg={4} md={4} sm={4} xs={12}><Form.Check name="formality" checked={formality === "none"} type="radio" label="None" id="radio1" onChange={() => setFormality("none")}></Form.Check></Col>
                                <Col className="d-flex justify-content-center" lg={4} md={4} sm={4} xs={12}><Form.Check name="formality" checked={formality === "casual"} type="radio" label="Casual" id="radio2" onChange={() => setFormality("casual")}></Form.Check></Col>
                                <Col className="d-flex justify-content-center" lg={4} md={4} sm={4} xs={12}><Form.Check name="formality" checked={formality === "formal"} type="radio" label="Formal" id="radio3" onChange={() => setFormality("formal")}></Form.Check></Col>
                            </Row>
                        </Form.Group>
                        :null
                    }
                </Form>
                { working &&
                    <LoadingComponent textput="Evaluating"/>
                }
                { (type === 0 || type === 2) && done && !working && !change && score ? 
                        <div className="fade-in">
                            <Col className="d-flex flex-column m-0 p-0 justify-content-center text-center align-items-center">
                                <p className="m-0 mt-2">Fluency</p>
                                <h1 className="m-0 exclude score fw-bold" style={{color:color, fontSize:"65px"}}>{score}%</h1>
                            </Col>
                            <h5 className="fw-bold">Problems</h5>
                            <p>{problems}</p>
                            <h5 className="fw-bold">Alternate Version</h5>
                            <p className="mb-0">{alternate}</p>
                        </div>
                : 
                    type === 1 && done && !change ?
                        <>
                            <Row>
                                { translation && !working ?
                                    <p className="mt-4 text-center fade-in">{translation}</p>
                                    :<span className="mt-4 text-center"><LoadingComponent textput="Translating"/></span>
                                }
                            </Row>
                            <Row>
                                {
                                    results[0] ?
                                        results.length <= 5 ?
                                            results.map((result) => (
                                                <p className="fs-5 mt-1 fade-in"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                            ))
                                        :results.length > 5  && results.length <= 10?
                                            <Row className="fade-in p-0 m-0">
                                                <Col>
                                                    {results.slice(0,5).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col>
                                                    {results.slice(5).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                            </Row>
                                        :results.length > 10  && results.length <= 15?
                                            <Row className="fade-in p-0 m-0">
                                                <Col lg={4} md={4} sm={4}>
                                                    {results.slice(0,5).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col lg={4} md={4} sm={4}>
                                                    {results.slice(5,10).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col lg={4} md={4} sm={4}>
                                                    {results.slice(10).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                            </Row>
                                        :results.length > 15  && results.length <= 20?
                                            <Row className="fade-in p-0 m-0">
                                                <Col lg={3} md={3} sm={3}>
                                                    {results.slice(0,5).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col lg={3} md={3} sm={3}>
                                                    {results.slice(5,10).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col lg={3} md={3} sm={3}>
                                                    {results.slice(10,15).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                                <Col lg={3} md={3} sm={3}>
                                                    {results.slice(15).map((result) => (
                                                        <p className="fs-5 mt-1"><ruby>{result.word}<rt>{result.reading}</rt></ruby> - {result.meaning}</p>
                                                    ))}
                                                </Col>
                                            </Row>
                                        :<p className="fade-in">Too much content</p>
                                    :<p className="fade-in">No results found</p>
                                }
                            </Row>
                        </>
                :null
                }
                { error && !working && !score && !translation &&
                    <p className="fade-in mb-0 mt-2">{error}</p>
                }
            </Container>
        </Container>
        <p className="animate__animated animate__fadeInUp mb-3 p-0 spec-co exclude text-center"><a onClick={() => setOpen(true)} className="fnt-italic mb-3 spec-co" style={{cursor:"pointer"}}>How to use</a> | Dictionary lookups may not be completely accurate</p>
        <div className="fade-in custom-modal" style={{display: open ? "flex" : "none"}}>
            <Container className="d-flex flex-column align-items-center modal-content p-0 rounded-4">
                <Row className="d-flex justify-content-end align-items-end text-end w-100 h-auto pe-3 pt-2"><span className="h-auto w-auto close p-0 m-0" onClick={() => setOpen(false)}>&times;</span></Row>
                <Row className="d-flex justify-content-center text-center w-100 p-0 m-0"><h3 className="m-0 p-0">Effectively using the site</h3></Row>
                <div className="p-5">
                    <p className="text-center">
                        This website is purely for learning purpose, and is not a pure tool/translator<br></br>
                    </p>
                    <h5>Fluency evaluator</h5>
                    <p>Evaluates how fluent given japanese text is, and offers feedback + a better alternative. Use when practicing grammar and formality through sentence construction, or when unsure about grammar usage</p>
                    <h5>Word extractor</h5>
                    <p>Translates text and extracts individual kanji/katakana vocabulary. Use when learning unfamiliar vocabulary from books/articles/pdfs, etc. However it is currently a bit flawed in terms of furigana, since it would depend on context of the text. Will fix this and also add extraction of grammar techniques</p>
                    <p>Useful websites:<br></br><a href="https://tadoku.org/japanese/en/free-books-en/">https://tadoku.org/japanese/en/free-books-en/</a><br></br><a href="https://news.web.nhk/news/easy">https://news.web.nhk/news/easy</a></p>
                </div>
            </Container>
        </div>
    </>
  )
}

export default HomeScreen