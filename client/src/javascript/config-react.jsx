/*global React*/
/*global ReactDOM*/
/*global io*/
/*global FreshrContext*/
/*global qrcodelib*/

var configSocket = io('/~config');

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
			<div className="task-col">
				<Task task={this.props.task} onSelectionChange={this.handleSelectionChange}></Task>
			</div>
			<TaskLogDisplay task={this.state.selectedTask}></TaskLogDisplay>
		</div>;
	}
}

class QRComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {dataUrl: null};
	}

	componentWillMount() {
		this.generateQrCode(this.props.text);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.text !== this.props.text) {
			this.generateQrCode(nextProps.text);
		}
	}

	generateQrCode(text) {
		if(text) {
			qrcodelib.toDataURL(text, {}, (err, url) => {
				if(err) {
					console.error('QRComponent', err);
				}
				else {
					this.setState({dataUrl: url});
				}
			});
		}
	}

	render() {
		return <div>
			{this.state.dataUrl && <img src={this.state.dataUrl} />}
		</div>;
	}
}

class ConfigComponent extends React.Component {

	handleClickBuild(event) {
		configSocket.emit('build');
	}

	render() {
		return <div>
			<header>
				<h1 className="title">Freshr Configuration</h1>
			</header>
			<div className="page-content">
				<div className="ip-display">
					{[{name: 'Local URL', ip: this.props.config.serverLocalIp}, {name: 'Public URL', ip: this.props.config.serverPublicIp}].map(ipObj => {
						var url = ipObj.ip && 'http://' + ipObj.ip + ':' + this.props.config.serverPort;
						return <div key={ipObj.name}>
							<span>{ipObj.name}: {ipObj.ip ? url : 'unknown'}</span>
							<QRComponent text={url} />
						</div>;
					})}
				</div>
				<div className="build-display">
					<button onClick={this.handleClickBuild}>Build</button>
					{this.props.buildTask && <TaskDisplay task={this.props.buildTask} />}
					{this.props.config.categories.map(category => {
						return <div key={category.name} className="config card collapser-wrapper">
							<h2 className="card-title">{category.name} <button className="collapser"></button></h2>
							<div className="card-body collapser-target">
								<ul className="fields">
									{category.fields.map(field => {
										return <li key={field.name}>{field.name}</li>;
									})}
								</ul>
							</div>
						</div>;
					})}
				</div>
			</div>
		</div>;
	}
}

function getTask(task, taskPath) {
	if(taskPath.length === 0) {
		return task;
	}
	return getTask(task.tasks[taskPath[0]], taskPath.slice(1));
}

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

configSocket.on('publicip', function(ip) {
	FreshrContext.config.serverPublicIp = ip;
	render();
});

configSocket.emit('build');
configSocket.emit('publicip');

render();

function render() {
	const element = <ConfigComponent config={FreshrContext.config} buildTask={buildTasks.tasks} />;
	ReactDOM.render(
		element,
		document.getElementById('root')
	);
}


