/*global React*/
/*global ReactDOM*/
/*global io*/

class TaskLogDisplay extends React.Component {
	render() {
		return <div className="log-display">
			{this.props.task && this.props.task.logs &&
				<ul className="logs">
					{this.props.task.logs.map((l,i) => <li key={i}>{l.message}</li>)}
				</ul>}
		</div>;
	}
}

class Task extends React.Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e, data) {
		this.props.onSelectionChange(this.props.task);
	}

	render() {
		return <div className="task">
			<div
				className={`card${this.props.task.status === 1 ? ' success' : ''}${this.props.task.status === 2 ? ' warn' : ''}${this.props.task.status === 3 ? ' error' : ''}`}
				onClick={this.handleClick}>
				<span className={`${this.props.task.running ? 'loader' : ''}`}></span>
				<span className="status">{this.props.task.status}</span>
				<span className="name">{this.props.task.name}</span>
			</div>
			{this.props.task.tasks.length > 0 &&
				<ul className="tasks">
					{this.props.task.tasks.map((t,i) => <li key={i}><Task task={t} onSelectionChange={this.props.onSelectionChange} /></li>)}
				</ul>
			}
		</div>;
	}
}

class TaskDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.state = {selectedTask: null};
		this.handleSelectionChange = this.handleSelectionChange.bind(this);
	}

	handleSelectionChange(data) {
		this.setState({
			selectedTask: data
		});
	}

	render() {
		return <div className="task-display">
			<Task task={this.props.task} onSelectionChange={this.handleSelectionChange}></Task>
			<TaskLogDisplay task={this.state.selectedTask}></TaskLogDisplay>
		</div>;
	}
}


var configSocket = io('/~config');

var buildTasks = {};

configSocket.on('build/start', function(tasks) {
	console.log('build/start', tasks);
	buildTasks = tasks;
	render();
});
configSocket.on('build/success', function(result) {
	console.log('build/success', result);
});
configSocket.on('build/fail', function(error) {
	console.log('build/fail', error);
});
configSocket.on('build/task/start', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = true;
	render();
});
configSocket.on('build/task/log', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.status = data.status;
	if(!task.logs) {
		task.logs = [];
	}
	task.logs.push(data.log);
	render();
});
configSocket.on('build/task/done', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = false;
	task.status = data.status;
	render();
});

configSocket.emit('build');

function render() {
	const element = <TaskDisplay task={buildTasks.tasks} />;
	ReactDOM.render(
		element,
		document.getElementById('root')
	);
}

function getTask(task, taskPath) {
	if(taskPath.length === 0) {
		return task;
	}
	return getTask(task.tasks[taskPath[0]], taskPath.slice(1));
}
