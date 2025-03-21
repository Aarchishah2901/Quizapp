const QuizType = require("../models/quizTypeModel");

exports.createQuizType = async (req,res) => {
    console.log("call fun");
    
    try
    {
        const { quiztype_name } = req.body;
        console.log("function");
        
        const existingQuiztpe = await QuizType.findOne({ quiztype_name: req.body.quiztype_name });
        if ( existingQuiztpe){
            return res.status(400).json({ message: "Quiz type allready exists" });
        }

        const newQuizType = new QuizType({ quiztype_name });
        console.log("New quiz", newQuizType)
        await newQuizType.save();
        res.status(201).json(newQuizType);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
};

exports.getQuizTypes = async (req, res) => {
    try
    {
        const quizTypes = await QuizType.find();
        res.status(200).json(quizTypes);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
};

exports.getQuizTypeById = async (req, res) => {
    try
    {
        const quizType = await QuizType.findById(req.params.id);
        if (!quizType)
            return res.status(404).json({ message: "Quiz type not found" });
        res.status(200).json(quizType);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
};

exports.updateQuizType = async (req, res) => {
    try
    {
        const updatedQuizType = await QuizType.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedQuizType)
            return res.status(404).json({ message: "Quiz type not found" });
        res.status(200).json(updatedQuizType);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteQuizType = async (req, res) => {
    try
    {
        const deletedQuizType = await QuizType.findByIdAndDelete(req.params.id);
        if (!deletedQuizType)
            return res.status(404).json({ message: "Quiz type not found" });
        res.status(200).json(deletedQuizType);
    }
    catch (error)
    {
        res.status(500).json({ error: error.message });
    }
};