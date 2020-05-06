//
// Course Admin Actions
// Course_id: req.course_id
//
const express = require('express');
const router = express.Router();
const courseService = require('../../services/course');
const resourceService = require('../../services/resource');
const response = require('../../util/response');
const quizzer = require('../../services/quiz');
const upload = require('../../middleware/upload');

//
// Fetch students registered to course
//
router.get('/students', async function (req, res) {
	const users = await courseService.getRegistered(req.course_id);
	if (users)
		return res.json(users);
	return res.status(500);
});

router.get('/students/download', async function (req, res) {
	res.setHeader('Content-disposition', 'attachment; filename=export.csv');
	res.setHeader('Content-type', 'text/csv');

	const registeredCSV = await courseService.getRegisteredCSV(req.course_id);

	return res.send(registeredCSV);
});

// Add a resource to course
router.post('/resource/add', upload.single('res'), async function (req, res) {
	const { name, topic, description, link } = req.body;

	if (!req.file && !link)
			return res.status(400).send('Missing');

	const url = req.file ? `/uploads/${req.file.filename}` : link;
		
	try {
		await resourceService.create({
			name,
			topic,
			description,
			course: req.course_id,
			url
		});
		res.redirect(`/dashboard/admin/${req.course_id}`)
	} catch (e) {
		res.send(response.error(err.message))
	}

});

// Delete a resource from course
router.post('/resource/remove', async function (req, res, next) {
	try {
		await resourceService.delete(req.body.id);
		res.send({
			success: true
		})
	} catch (e) {
		res.send({
			success: false,
			error: err,
			body: req.body
		})
	}

});

// Initialize Quiz Creation
router.post('/quiz/init', async function(req, res, next) {
	const { name } = req.body;
	try {
		const quiz = await quizzer.createQuiz(name, req.course_id, [])
		return res.json({
			success: true,
			quiz
		})
	} catch (e) {
		return res.json({
			success: false
		})
	}
})

router.post('/quiz/destroy', async function(req, res, next) {
	const { _id, name } = req.body;
	try {
		await quizzer.deleteQuiz(_id, name);
		return res.json({
			success: true
		})
	} catch (e) {
		return res.json({
			success: false
		})
	}
})

//
router.post('/quiz/update', async function(req, res, next) {
	const { quiz_id, question_id, type, data } = req.body;
	try {
		if (type == 'add') {
			await quizzer.addQuestion(quiz_id, data)
		}
		else if (type == 'update') {
			await quizzer.updateQuestion(question_id, data)
		}
		else if (type == 'delete') {
			await quizzer.deleteQuestion(quiz_id, question_id)
		}
		else {
			return res.json({
				success: false,
				message: 'Invalid/Blank operation type'
			})
		}
		return res.json(
			{ success: true}
		)
	} catch (e) {
		return res.json({
			success: false
		})
	}

})

module.exports = router;